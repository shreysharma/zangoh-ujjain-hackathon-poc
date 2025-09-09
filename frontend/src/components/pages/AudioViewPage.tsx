"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../Header";
import MainBotView from "../MainBotView";
import Notification from "../Notification";
import { useGlobalConversation } from "../../providers/ConversationProvider";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { useConnectionManager } from "../../hooks/useConnectionManager";
import { useStreamConnection } from "../../providers/StreamConnectionProvider";
import { videoService } from "../../services/videoService";
import { audioService } from "../../services/audioService";
import SimpleControls from "../controls/SimpleControls";
import ComprehensiveControls from "../controls/ComprehensiveControls";
import ChatView from "../ChatView";
import Subtitles from "../Subtitles";
const AudioViewPage = () => {
  const router = useRouter();
  const { messages, addHumanMessage, addStatusMessage } = useGlobalConversation();
  
  // Handle image selection from file picker
  const handleImageSelect = async (imageUrl: string, fileName: string) => {
    // Show the message without storing the large image data
    await addHumanMessage(`📎 Uploaded image: ${fileName}`);
    
    // Store preview for UI display (not in localStorage)
    setCurrentImagePreview({ url: imageUrl, name: fileName });
    
    // Clear preview after 10 seconds
    setTimeout(() => {
      setCurrentImagePreview(null);
    }, 10000);
  };
  const { isStreamConnected, streamDisconnectionReason } = useStreamConnection();
  // Only show bot messages in audio view, but keep user messages in storage for chat view
  const latestBotMessage = messages
    .filter((msg) => msg.type === "bot")
    .slice(-1)[0];

  // Get only the latest product search results (not all accumulated products)
  const latestProductMessage = messages
    .filter(
      (msg) =>
        msg.type === "product_links" &&
        msg.productLinks &&
        msg.productLinks.length > 0
    )
    .slice(-1)[0]; // Get the most recent product_links message

  const latestProducts = latestProductMessage?.productLinks || [];

  // Direct microphone control
  const { isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition();

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Video states
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<
    "user" | "environment"
  >("user");
  
  // Recording timer states
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Animation state
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Audio enable state
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [showReconnectPopup, setShowReconnectPopup] = useState(false);
  const [userStoppedMic, setUserStoppedMic] = useState(false); // Track if user manually stopped mic
  
  // Chat view toggle state
  const [showChatView, setShowChatView] = useState(false);
  
  // Image preview state (not stored in localStorage)
  const [currentImagePreview, setCurrentImagePreview] = useState<{url: string, name: string} | null>(null);
  
  // Subtitle state - persist transcript until audio finishes
  const [subtitleText, setSubtitleText] = useState('');
  // Store complete transcript for subtitle display
  const [completeTranscript, setCompleteTranscript] = useState('');

  
  // Track previous view when video is opened
  const [previousViewWasChat, setPreviousViewWasChat] = useState(false);

  // Timer effect for recording duration
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isVideoOpen && recordingStartTime) {
      intervalId = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - recordingStartTime.getTime()) / 1000);
        setRecordingDuration(duration);
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isVideoOpen, recordingStartTime]);
  
  // Track actual audio playing state from audioService
  const [isBotAudioPlaying, setIsBotAudioPlaying] = useState(false);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setNotification({ message, type });
  };

  // Initialize connection manager in a stable way to avoid render phase state updates
  const connectionManager = useConnectionManager(showNotification);
  const {
    isConnected,
    isConnecting,
    responseModality,
    currentTurnActive,
    currentTranscriptionBuffer,
    displayTranscript,
    currentUserTranscript,
    isAudioMode,
    handleConnect,
    handleConnectionToggle,
    handleChatMessage,
  } = connectionManager;

  // Capture complete transcript when it's available
  useEffect(() => {
    if (currentTranscriptionBuffer) {
      setCompleteTranscript(currentTranscriptionBuffer);
    }
  }, [currentTranscriptionBuffer]);

  // Show complete transcript when audio starts playing, hide when audio stops
  useEffect(() => {
    
    if (isBotAudioPlaying && completeTranscript) {
      // Show complete transcript when audio is playing
      setSubtitleText(completeTranscript);
     } else if (!isBotAudioPlaying) {
      // Immediately clear subtitle when audio stops playing
      setSubtitleText('');
    }
  }, [isBotAudioPlaying, completeTranscript]);

  // Clear stored transcript when transcription buffer is cleared (turn complete)
  useEffect(() => {
    if (!currentTranscriptionBuffer && !isBotAudioPlaying) {
      setCompleteTranscript('');
    }
  }, [currentTranscriptionBuffer, isBotAudioPlaying]);

  const handleSwitchToChat = () => {
    // Stop microphone and audio streaming before navigating to chat
    if (isListening) {
      
      stopListening();
      audioService.stopAudioProcessing();
    }
    router.push("/chat");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  // Format recording duration to MM:SS
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle between chat view and audio view
  const handleToggleChatView = () => {
    const newShowChatView = !showChatView;
    
    // Add status message for view switching
    if (newShowChatView) {
      addStatusMessage('Switched to Chat View');
    } else {
      addStatusMessage('Switched to Voice View');
    }
    
    // Stop microphone and audio processing when switching to chat view
    if (newShowChatView) {
      if (isListening) {
        stopListening();
      }
      
      // Stop any ongoing audio playback
      if (audioService.isPlaying) {
       audioService.stopCurrentAudio();
        audioService.clearAudioQueue();
      }
    }
    
    setShowChatView(newShowChatView);
  };

  // Handle audio enable button click - specifically for enabling audio playback
  const handleAudioEnable = async () => {
    try {
      
      const activated = await audioService.activateAudioContext();

      if (activated) {
        // Set localStorage keys to remember user wants audio auto-enabled
        localStorage.setItem("audioAutoEnabled", "true");
        localStorage.setItem("microphoneAutoEnabled", "true");
        localStorage.setItem("lastAudioActivation", Date.now().toString());
        
        setIsAudioEnabled(true);
        // showNotification('Audio playback enabled! You can now hear responses.', 'success')
        

        // Enable audio playback in service
        audioService.setAudioEnabled(true);

        // If connected and in audio mode, also setup microphone
        if (isConnected && responseModality === "AUDIO" && !isListening) {
          
          try {
            audioService.setShouldSendAudioCallback(
              () => responseModality === "AUDIO"
            );
            audioService.setUserSpeakingCallback((isSpeaking: boolean) => {
             
            });

            await audioService.setupAudioProcessing();
            startListening();
            // showNotification('Audio and microphone both activated!', 'success')
          } catch (error) {
            console.error(
              "Microphone setup failed after audio activation:",
              error
            );
            showNotification(
              "Audio playback enabled, but microphone setup failed",
              "info"
            );
          }
        }
      } else {
        // showNotification('Audio activation failed - please try again', 'error')
       
      }
    } catch (error) {
      console.error("Audio enable error:", error);
      showNotification("Audio activation failed", "error");
    }
  };

  // Detect mobile device on client side
  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  // Load animation data
  useEffect(() => {
    fetch("/newanime.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAnimationData(data);
      })
      .catch((err) => {
        console.error("Animation file could not be loaded:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Check localStorage and show reconnect popup on refresh
  useEffect(() => {
    const checkForReconnect = () => {
      
      const audioAutoEnabled = localStorage.getItem('audioAutoEnabled')
      const microphoneAutoEnabled = localStorage.getItem('microphoneAutoEnabled')
      const lastActivation = localStorage.getItem('lastAudioActivation')

     

      // Only show popup if user has previously enabled audio AND has activation timestamp
      if (audioAutoEnabled === 'true' && microphoneAutoEnabled === 'true' && lastActivation) {
        setShowReconnectPopup(true)
      } else {
       
        // Auto-connect for new users or users without complete audio history
        setTimeout(async () => {
          if (!isConnected && !isConnecting) {
            // First activate audio context (this satisfies browser interaction requirement)
            try {
              const audioActivated = await audioService.activateAudioContext()
              if (audioActivated) {
                setIsAudioEnabled(true)
                audioService.setAudioEnabled(true)
                
                // Set localStorage keys to remember user preferences
                localStorage.setItem('audioAutoEnabled', 'true')
                localStorage.setItem('microphoneAutoEnabled', 'true')
                localStorage.setItem('lastAudioActivation', Date.now().toString())
              }
            } catch (error) {
              console.error('Failed to activate audio for new user:', error)
            }

            // Then connect to backend
            handleConnect()
            // showNotification('Connecting to AI backend...', 'info')
          }
        }, 500)
      }
    }

    // Check localStorage and show popup if needed
    checkForReconnect()
  }, []) // Run once on mount

  // Check audio context status periodically
  useEffect(() => {
    const checkAudioStatus = () => {
      const isReady = audioService.isAudioContextReady();
      const audioEnabled = audioService.isAudioPlaybackEnabled();
      setIsAudioEnabled(isReady && audioEnabled);

    };

    // Check immediately
    checkAudioStatus();

    // Check every 2 seconds
    const interval = setInterval(checkAudioStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkForReconnect = () => {
      
      const audioAutoEnabled = localStorage.getItem('audioAutoEnabled')
      const microphoneAutoEnabled = localStorage.getItem('microphoneAutoEnabled')
      const lastActivation = localStorage.getItem('lastAudioActivation')

      // Only show popup if user has previously enabled audio AND has activation timestamp
      if (audioAutoEnabled === 'true' && microphoneAutoEnabled === 'true' && lastActivation) {
        setShowReconnectPopup(true)
      } else {
        
        // Auto-connect for new users or users without complete audio history
        setTimeout(async () => {
          if (!isConnected && !isConnecting) {
            // First activate audio context (this satisfies browser interaction requirement)
            try {
              const audioActivated = await audioService.activateAudioContext()
              if (audioActivated) {
                setIsAudioEnabled(true)
                audioService.setAudioEnabled(true)
                
                // Set localStorage keys to remember user preferences
                localStorage.setItem('audioAutoEnabled', 'true')
                localStorage.setItem('microphoneAutoEnabled', 'true')
                localStorage.setItem('lastAudioActivation', Date.now().toString())
              }
            } catch (error) {
              console.error('Failed to activate audio for new user:', error)
            }

            // Then connect to backend
            handleConnect()
            // showNotification('Connecting to AI backend...', 'info')
          }
        }, 500)
      }
    }

    // Check localStorage and show popup if needed
    checkForReconnect()
  }, []) // Run once on mount
  // Handle reconnect button click - connects + enables everything
  const handleReconnectClick = async () => {
    try {
     
      setShowReconnectPopup(false);

      // Step 1: Activate audio context (user click satisfies browser policy)
      const audioActivated = await audioService.activateAudioContext();
      if (audioActivated) {
        setIsAudioEnabled(true);
        audioService.setAudioEnabled(true);
      }

      await handleConnect();

    } catch (error) {
      console.error("Reconnect error:", error);
      showNotification("Connection failed. Please try again.", "error");
    }
  };

  // Start microphone when connected and audio is enabled
  useEffect(() => {
    let mounted = true;
    let micTimer: NodeJS.Timeout | null = null;

    // Only start microphone if connected, audio enabled, not already listening, AND user hasn't manually stopped it
    if (
      isSupported &&
      !isListening &&
      isConnected &&
      responseModality === "AUDIO" &&
      isAudioEnabled &&
      !userStoppedMic
    ) {
     

      micTimer = setTimeout(async () => {
        if (mounted && !isListening && isConnected && isAudioEnabled) {
          try {
            // Setup audio processing for real-time streaming to backend
            audioService.setShouldSendAudioCallback(
              () => responseModality === "AUDIO"
            );

            // Setup user speaking callback for interruption detection
            audioService.setUserSpeakingCallback((isSpeaking: boolean) => {
            
            });

            await audioService.setupAudioProcessing();

            // Start speech recognition
            startListening();
            // showNotification('Microphone activated - audio streaming enabled', 'success')
          } catch (error) {
            console.error("Failed to setup audio streaming:", error);
            showNotification(
              "Microphone setup failed - please allow permission",
              "error"
            );
          }
        }
      }, 1500); // Slightly longer delay to allow audio activation to complete
    }

    return () => {
      mounted = false;
      if (micTimer) {
        clearTimeout(micTimer);
      }
    };
  }, [isConnected, responseModality, isAudioEnabled, isListening]); // Added isAudioEnabled dependency

  // Auto-activate audio on first user interaction
  useEffect(() => {
    const activateAudioOnInteraction = async () => {
      if (isConnected && responseModality === "AUDIO") {
        const wasReady = audioService.isAudioContextReady();
        const activated = await audioService.activateAudioContext();

        if (activated && !wasReady) {
          
          // showNotification('Audio enabled! Setting up microphone...', 'success')
          // Session storage flag is automatically set in audioService.activateAudioContext()

          // Retry microphone setup now that audio is activated
          try {
            audioService.setShouldSendAudioCallback(
              () => responseModality === "AUDIO"
            );
            audioService.setUserSpeakingCallback((isSpeaking: boolean) => {
              
            });

            await audioService.setupAudioProcessing();
            startListening();
            // showNotification('Microphone activated - you can now speak!', 'success')
          } catch (error) {
            console.error("Failed to setup audio after activation:", error);
            showNotification(
              "Microphone setup failed - please allow permission",
              "error"
            );
          }
        }
      }
    };

    // Listen for any user interaction to activate audio
    const events = ["click", "touchstart", "keydown"];
    events.forEach((event) =>
      document.addEventListener(event, activateAudioOnInteraction, {
        once: true,
      })
    );

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, activateAudioOnInteraction)
      );
    };
  }, [isConnected, responseModality, isListening, startListening]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
        audioService.stopAudioProcessing();
      }
    };
  }, []); // Only run on unmount



  // Set up audio playing state callback
  useEffect(() => {
    audioService.setAudioPlayingCallback((isPlaying) => {
      setIsBotAudioPlaying(isPlaying);
    });

    return () => {
      audioService.setAudioPlayingCallback(() => {}); // Clear callback on unmount
    };
  }, []);

  // Video handling functions
  const handleVideoClick = async () => {
    
    if (!isVideoOpen) {
      // Add status message for camera opening
      addStatusMessage('Camera opened');
      // Remember current view before opening video
      setPreviousViewWasChat(showChatView);
      
      // Start recording timer
      setRecordingStartTime(new Date());
      setRecordingDuration(0);
      try {
      
        // Use videoService to start camera directly
        const stream = await videoService.startCamera(currentFacingMode);

        // Set video open state first to trigger video element rendering
        setIsVideoOpen(true);
        setIsVideoLoaded(false);

        // Wait for React to render the video element
        setTimeout(async () => {

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoService.setVideoElement(videoRef.current);

            // Wait for video to load
            videoRef.current.onloadedmetadata = async () => {
              
              setIsVideoLoaded(true);

              try {
                if (videoRef.current) {
                  await videoRef.current.play();
                 
                  if (isConnected) {
                    videoService.startFrameCapture(2000);
                  }
                }
              } catch (playError) {
                console.error("❌ Video play failed:", playError);
                // showNotification('Camera started but video display failed', 'error')
              }
            };

            // Fallback: try to play immediately
            try {
              await videoRef.current.play();
              setIsVideoLoaded(true);
              // showNotification('Camera started successfully!', 'success')

              if (isConnected) {
                videoService.startFrameCapture(2000);
              }
            } catch (error) {
              
            }
          } else {
            console.error("❌ Video element not found after state update");
            // showNotification('Video element not ready', 'error')
            setIsVideoOpen(false);
          }
        }, 100); // Small delay to allow React to render
      } catch (error) {
        console.error("❌ Camera error:", error);
        showNotification(
          error instanceof Error ? error.message : "Failed to start camera",
          "error"
        );
        setIsVideoOpen(false);
        setIsVideoLoaded(false);
      }
    } else {
      try {
        // Capture last frame before stopping
        const capturedFrameUrl = await videoService.captureFrameAsBlob();
        if (capturedFrameUrl) {
          
          const fileInfo = {
            name: `camera-capture-${Date.now()}.png`,
            type: "image/png",
            url: capturedFrameUrl,
          };

          addHumanMessage("Product shown live on call", fileInfo);
          // showNotification('Last frame captured and added to conversation', 'success')
        }
      } catch (error) {
        console.error("Error capturing last frame:", error);
      }

      videoService.stopVideoStream();
      setIsVideoOpen(false);
      setIsVideoLoaded(false);
      
      // Reset recording timer
      setRecordingStartTime(null);
      setRecordingDuration(0);
      
      // Add status message for camera closing
      // addStatusMessage('📹 Camera closed');
      
      // Return to previous view
      setShowChatView(previousViewWasChat);
      // showNotification('Camera stopped', 'info')
    }
  };

  const handleCameraSwitch = async () => {
    if (!isVideoOpen || !isMobile) return;

    try {
      // showNotification('Switching camera...', 'info')
      const newFacingMode =
        currentFacingMode === "user" ? "environment" : "user";
      
      // Add status message for camera switching
      const cameraType = newFacingMode === "user" ? "Front Camera" : "Back Camera";
      addStatusMessage(`Switched to ${cameraType}`);

      const stream = await videoService.switchCamera(currentFacingMode);
      setCurrentFacingMode(newFacingMode);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoService.setVideoElement(videoRef.current);
      }

      // showNotification('Camera switched successfully!', 'success')

      if (isConnected) {
        videoService.startFrameCapture(2000);
      }
    } catch (error) {
      console.error("Camera switch error:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to switch camera",
        "error"
      );
    }
  };

  const handleMicToggle = async () => {
    if (!isAudioEnabled || !isConnected) {
      try {
        const activated = await audioService.activateAudioContext()

        if (activated) {
          localStorage.setItem('audioAutoEnabled', 'true')
          localStorage.setItem('microphoneAutoEnabled', 'true')
          localStorage.setItem('lastAudioActivation', Date.now().toString())

          setIsAudioEnabled(true)
          setUserStoppedMic(false) // Reset user stop flag when audio is activated
          audioService.setAudioEnabled(true)
          audioService.setShouldSendAudioCallback(() => true)

          if (isConnected && responseModality === 'AUDIO' && !isListening) {
            try {
              
              await audioService.setupAudioProcessing()
              startListening()
            } catch (error) {
              console.error('Microphone setup failed:', error)
            }
          }
        }
      } catch (error) {
        console.error('Audio enable error:', error)
      }
    } else {
      // Toggle mic on/off - ensure proper state handling
      try {
        if (isListening) {
          // User manually stopped microphone
          setUserStoppedMic(true)
          stopListening()
          audioService.setShouldSendAudioCallback(() => false)
          audioService.stopAudioProcessing()
        } else {
          // User manually started microphone
          setUserStoppedMic(false)
          audioService.setShouldSendAudioCallback(() => responseModality === 'AUDIO')
          await audioService.setupAudioProcessing()
          startListening()
        }
      } catch (error) {
        console.error('Microphone toggle error:', error)
      }
    }
  }

  return (
    <main className="w-screen h-screen flex justify-center items-center overflow-hidden">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Reconnect popup */}
      {showReconnectPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl" style={{width: '280px', padding: '28px 20px 32px 20px'}}>
            <div className="text-center">
              <h3 className="text-gray-900 text-base font-semibold mb-3">
                Enable Voice Assistant
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed px-2" style={{marginBottom: '24px'}}>
                Allow microphone access to start your voice conversation
              </p>
              
              <button
                onClick={handleReconnectClick}
                className="bg-gradient-to-r from-[#E9842F] to-[#F46200] text-white rounded-lg hover:shadow-md transform hover:scale-105 transition-all duration-200 cursor-pointer"
                style={{
                  padding: '10px 32px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Enable Audio
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full max-w-[500px] h-full relative bg-white overflow-hidden`}>
        {(!isVideoOpen || showChatView) && (
          <Header
            onSwitchToChat={handleSwitchToChat}
            showChatView={showChatView}
            onBackClick={handleBackToHome}
            isConnected={isConnected}
            isConnecting={isConnecting}
            responseModality={responseModality}
            onConnectionToggle={handleConnectionToggle}
            onAudioEnable={handleAudioEnable}
            isAudioEnabled={isAudioEnabled}
            onToggleChatView={handleToggleChatView}
          />
        )}

        <div className="w-full h-full relative overflow-hidden">
          {!showChatView ? (
            <div className="relative w-full h-full">
              <MainBotView
                showChatView={showChatView}
                latestMessage={latestBotMessage}
                liveTranscription={displayTranscript}
                isVideoOpen={isVideoOpen}
                isVideoLoaded={isVideoLoaded}
                videoRef={videoRef}
                isSupported={isSupported}
                animationData={animationData}
                loading={loading}
                isListening={isListening}
                isBotSpeaking={isBotAudioPlaying}
                currentFacingMode={currentFacingMode}
                products={latestProducts}
                onMicToggle={handleMicToggle}
                currentImagePreview={currentImagePreview}
                userTranscript={currentUserTranscript}
                botTranscript={subtitleText}
              />
              
              {/* Recording Timer and Controls Overlay */}
              {isVideoOpen && isVideoLoaded && recordingStartTime && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full">
                  <div className="flex items-center gap-4 w-full justify-around">
                    {/* Recording Timer */}
                    <div 
                        className="flex items-center cursor-pointer justify-around gap-1 text-[#757575] text-[13px] min-w-[80px] h-[30px] rounded-lg"
                      >

                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white font-mono text-lg font-medium">
                        {formatRecordingTime(recordingDuration)}
                      </span>
                    </div>
                    
                    {/* Chat/Voice Toggle Button */}
                    <button 
                      onClick={handleToggleChatView} 
                      className="flex items-center cursor-pointer justify-around gap-1 text-[#757575] text-[13px] bg-[#FFFAF4] min-w-[80px] h-[30px] rounded-lg"
                      style={{ fontFamily: 'Inter, sans-serif'}}
                    >
                      {showChatView ? (
                        <p>Voice</p>
                      ) : (
                        <p>Chat</p>
                      )}
                      <img src="./switch.svg" alt="Switch" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Stream Disconnection Indicator */}
              {!isStreamConnected && (
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="flex items-center gap-2 bg-red-600 bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white font-medium text-sm">
                      Stream Disconnected
                      {streamDisconnectionReason && `: ${streamDisconnectionReason}`}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Subtitles Overlay */}
              {isVideoOpen && isVideoLoaded && (
                <div className="absolute top-28 left-0 right-0 z-40">
                  <Subtitles
                    userText={currentUserTranscript}
                    botText={subtitleText}
                    isUserSpeaking={isListening}
                    isBotSpeaking={isBotAudioPlaying}
                    className="mx-4"
                    isVideoMode={true}
                  />
                </div>
              )}
            </div>
          ) : (
            <ChatView
              showChatView={showChatView}
              messages={messages}
              onSendMessage={handleChatMessage}
              onVideoToggle={() => {
                setShowChatView(false)
                handleVideoClick()
              }}
            />
          )}
        </div>

        {/* Control Panel - Only show in audio view */}
        {!showChatView && (
          !isVideoOpen ? (
            <SimpleControls
              isVideoOpen={isVideoOpen}
              isListening={isListening}
              onVideoClick={handleVideoClick}
              onMicToggle={handleMicToggle}
              onImageSelect={handleImageSelect}
            />
          ) : (
            <ComprehensiveControls
              isListening={isListening}
              currentTurnActive={isBotAudioPlaying}
              onVideoClick={handleVideoClick}
              onCameraSwitch={handleCameraSwitch}
              onMicToggle={handleMicToggle}
            />
          )
        )}


        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-3 w-[170px] h-[6px] bg-black m-4 rounded-full"></div>
      </div>
    </main>
  );
};

export default AudioViewPage;

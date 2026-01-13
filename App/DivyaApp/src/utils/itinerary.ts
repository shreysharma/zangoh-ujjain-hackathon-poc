export type ItineraryActivity = {
  title: string;
  description?: string;
  time?: string;
  location?: string;
};

export type ItineraryDay = {
  title: string;
  description?: string;
  activities: ItineraryActivity[];
};

export type Itinerary = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  days: ItineraryDay[];
};

const asString = (val: any): string | null => {
  if (typeof val === 'string') return val;
  if (val === undefined || val === null) return null;
  try {
    return String(val);
  } catch {
    return null;
  }
};

export const parseBackendItinerary = (raw: any): Itinerary | null => {
  if (!raw) return null;
  const data = raw.data ?? raw;
  const title =
    asString(data.title) ||
    asString(data.name) ||
    asString(data.destination) ||
    'Itinerary';
  const subtitle =
    asString(data.subtitle) ||
    asString(data.plan_overview) ||
    asString(data.summary) ||
    asString(data.overview);

  const coverImage =
    asString(data.cover_image) ||
    asString(data.coverImage) ||
    asString(data.imageUrl) ||
    asString(data.image_url) ||
    undefined;

  const daySources =
    (Array.isArray(data.days) && data.days) ||
    (Array.isArray(data.plan?.days) && data.plan.days) ||
    [];

  const toActivity = (a: any): ItineraryActivity => {
    // Handle objects keyed by a time slot, e.g. { "06:00 - 07:00": { plan_name, plan_description } }
    if (a && typeof a === 'object') {
      const timeKeys = Object.keys(a || {}).filter(key => /\d{1,2}:\d{2}/.test(key));
      if (timeKeys.length === 1) {
        const timeKey = timeKeys[0];
        const inner = (a as any)[timeKey];
        const innerObj = inner && typeof inner === 'object' ? inner : {};
        return {
          title:
            asString(innerObj.plan_name) ||
            asString(innerObj.title) ||
            asString(innerObj.name) ||
            'Activity',
          description:
            asString(innerObj.plan_description) ||
            asString(innerObj.description) ||
            asString(innerObj.details) ||
            undefined,
          time: timeKey,
          location: asString(innerObj.location) || undefined,
        };
      }
    }

    const activityTitle =
      asString(a?.title) ||
      asString(a?.name) ||
      asString(a?.activity) ||
      asString(a?.summary) ||
      (typeof a === 'string' ? a : 'Activity');
    return {
      title: activityTitle || 'Activity',
      description:
        asString(a?.description) || asString(a?.details) || asString(a?.note) || undefined,
      time:
        asString(a?.time) ||
        asString(a?.start_time) ||
        asString(a?.time_of_day) ||
        undefined,
      location: asString(a?.location) || undefined,
    };
  };

  const days = daySources.map((day: any, idx: number): ItineraryDay => {
    if (!Array.isArray(day) && typeof day === 'object' && day !== null) {
      const keys = Object.keys(day);
      if (keys.length === 1 && Array.isArray((day as any)[keys[0]])) {
        const titleKey = keys[0];
        const activities = ((day as any)[titleKey] as any[]).map(toActivity);
        return {
          title: titleKey || `Day ${idx + 1}`,
          description: undefined,
          activities,
        };
      }
    }

    const activitiesSource =
      (Array.isArray(day?.activities) && day.activities) ||
      (Array.isArray(day?.items) && day.items) ||
      (Array.isArray(day?.events) && day.events) ||
      (Array.isArray(day) && day) ||
      [];
    const activities = activitiesSource.map((a: any): ItineraryActivity => toActivity(a));

    return {
      title:
        asString(day.title) ||
        asString(day.day_title) ||
        asString(day.day) ||
        `Day ${idx + 1}`,
      description: asString(day.description) || asString(day.summary) || undefined,
      activities,
    };
  });

  if (!title && !days.length) return null;

  return {
    id: asString(data.id) || `itinerary-${Date.now()}`,
    title: title || 'Itinerary',
    subtitle: subtitle || undefined,
    description: asString(data.description) || undefined,
    coverImage,
    days,
  };
};

export const InputValidator = {
  sanitize: (text: string): string => {
    if (!text) return "";
    let clean = text.trim();
    clean = clean.replace(/<script.*?>.*?<\/script>/gi, "");
    clean = clean.replace(/[<>]/g, "");
    return clean;
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validateIncident: (description: string, location: string) => {
    const errors: string[] = [];

    if (!description || description.length < 10) {
      errors.push("Description must be at least 10 characters long.");
    }
    if (description.length > 500) {
      errors.push("Description allows a maximum of 500 characters.");
    }
    if (!location || location.length < 3) {
      errors.push("Please enter a valid location.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateAsset: (name: string, nextDueDate: string) => {
    const errors: string[] = [];

    if (!name || name.length < 2) errors.push("Asset name is too short.");

    const selectedDate = new Date(nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      errors.push("Next Due Date cannot be in the past.");
    }

    return { isValid: errors.length === 0, errors };
  },
};

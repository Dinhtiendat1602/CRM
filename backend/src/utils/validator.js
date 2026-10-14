const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?\d{9,11}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

const validateRequired = (fields, data) => {
  const missing = [];
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  return missing;
};

module.exports = {
  isValidEmail,
  isValidPhone,
  validateRequired,
};

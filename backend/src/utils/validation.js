export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10,13}$/;
  return re.test(phone);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateConsultation = (keluhan) => {
  return keluhan && keluhan.trim().length >= 10;
};

export const validateMedicineStock = (stock) => {
  return stock >= 0;
};

export const validatePrice = (price) => {
  return price > 0;
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};
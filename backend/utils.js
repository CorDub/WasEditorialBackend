import crypto from 'crypto';

function createRandomPassword() {
  const pw = crypto.randomBytes(12).toString('hex');
  return pw
}

export default createRandomPassword;

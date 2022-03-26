import crypto from 'crypto';
import publicIp from 'public-ip';

import logger from './logger';

async function createId() {
  const ip = await publicIp.v4();
  const hash = crypto.createHash('sha256').update(ip).digest('hex');

  return hash;
}

const getUUID = async () => {
  try {
    if (!localStorage.getItem('uuid'))
      localStorage.setItem('uuid', await createId());

    return localStorage.getItem('uuid') || '';
  } catch (error) {
    logger.error(error);
    return '';
  }
};

export default getUUID;

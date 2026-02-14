const axios = require('axios');

const sendToPython = async (fileBuffer) => {
  const response = await axios.post(process.env.PYTHON_API_URL + '/process-cv', fileBuffer, {
    headers: { 'Content-Type': 'application/pdf' }
  });
  return response.data;
};

module.exports = { sendToPython };

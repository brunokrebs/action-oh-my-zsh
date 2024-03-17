import * as httpm from '@actions/http-client';

export async function getTunnelsWithTimeout() {
  const httpClient = new httpm.HttpClient();
  const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 10000);
  });
  const requestPromise = httpClient
    .get('http://127.0.0.1:4040/api/tunnels')
    .then(response => response.readBody())
    .then(body => JSON.parse(body));
  
  return Promise.race([requestPromise, timeoutPromise]);
}

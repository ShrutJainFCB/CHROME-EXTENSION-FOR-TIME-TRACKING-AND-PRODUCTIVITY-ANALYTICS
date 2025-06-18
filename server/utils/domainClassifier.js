const categories = {
    productive: [
      'stackoverflow.com',
      'github.com',
      'geeksforgeeks.org',
      'w3schools.com',
      'leetcode.com'
    ],
    unproductive: [
      'facebook.com',
      'instagram.com',
      'youtube.com',
      'netflix.com',
      'twitter.com'
    ]
  };
  
  function classifyDomain(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
  
      if (categories.productive.includes(domain)) return 'productive';
      if (categories.unproductive.includes(domain)) return 'unproductive';
      return 'neutral';
    } catch (err) {
      return 'unknown';
    }
  }
  
  module.exports = classifyDomain;  

// src/utils/algorithms.js

// Calculate similarity score between two users
function calculateSimilarityScore(userA, userB) {
  let score = 0;

  // Common skills: 3 points each
  const commonSkills = userA.skills.filter(skill => userB.skills.includes(skill)).length;
  score += commonSkills * 3;

  // Same goal: 5 points
  if (userA.goal === userB.goal) {
    score += 5;
  }

  // Same college: 2 points
  if (userA.college === userB.college) {
    score += 2;
  }

  // Same level: 3 points
  if (userA.level === userB.level) {
    score += 3;
  }

  return score;
}

// Calculate feed score for a video
function calculateFeedScore(video, creatorSimilarity, recencyFactor, likes) {
  return (creatorSimilarity * 5) + (recencyFactor * 3) + (likes * 2);
}

// Get recency factor (days since created, lower is better)
function getRecencyFactor(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
  return Math.max(0, 10 - daysDiff); // Max 10, decreases over time
}

// Auto cluster users based on skills and level
function autoClusterUsers(users) {
  const clusters = {};

  users.forEach(user => {
    const key = `${user.skills.join('-')}-${user.level}`;
    if (!clusters[key]) {
      clusters[key] = [];
    }
    clusters[key].push(user);
  });

  return clusters;
}

// Find study partners
function findStudyPartners(user, allUsers) {
  return allUsers
    .filter(other => other.id !== user.id)
    .filter(other => other.goal === user.goal && other.level === user.level)
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 5);
}

export {
  calculateSimilarityScore,
  calculateFeedScore,
  getRecencyFactor,
  autoClusterUsers,
  findStudyPartners
};
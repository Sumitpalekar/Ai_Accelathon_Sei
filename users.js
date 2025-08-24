
import fs from 'fs';
import path from 'path';

const usersFile = path.resolve('./data/users.json');

// Load all users
export function loadUsers() {
  try {
    if (!fs.existsSync(usersFile)) return {};
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch (e) {
    console.error('❌ Failed to load users:', e);
    return {};
  }
}

// Save all users
export function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('❌ Failed to save users:', e);
  }
}

// Set a wallet for a user
export function setUser(userId, wallet) {
  const users = loadUsers();
  users[userId] = wallet;
  saveUsers(users);
  return wallet;
}

// Get wallet for a user
export function getUser(userId) {
  const users = loadUsers();
  return users[userId];
}

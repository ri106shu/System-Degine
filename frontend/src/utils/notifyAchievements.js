import toast from 'react-hot-toast';

// Called from anywhere a completion action's response might carry
// newAchievements (topic/question/roadmap progress updates, finishing a
// mock) — one toast per newly unlocked achievement, never for ones already
// earned (the backend only ever includes genuinely new ones here).
export const notifyNewAchievements = (newAchievements) => {
  if (!newAchievements || newAchievements.length === 0) return;
  for (const achievement of newAchievements) {
    toast.success(`Achievement unlocked! "${achievement.name}"`, { icon: '\u{1F3C6}', duration: 5000 });
  }
};

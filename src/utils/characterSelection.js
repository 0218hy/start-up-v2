export const CHARACTER_CHOICES = [
  {
    id: "sprout",
    name: "Sprout",
    color: "#86EFAC",
    accent: "#166534",
    description: "A gentle wanderer for cozy garden worlds.",
  },
  {
    id: "ember",
    name: "Ember",
    color: "#FDBA74",
    accent: "#9A3412",
    description: "A bright-hearted explorer for warm little rooms.",
  },
  {
    id: "luna",
    name: "Luna",
    color: "#C4B5FD",
    accent: "#5B21B6",
    description: "A dreamy stargazer for quiet shared spaces.",
  },
];

export function characterStorageKey(userId) {
  return `nooklet:selected-character:${userId}`;
}

export function getCharacterById(characterId) {
  return CHARACTER_CHOICES.find((character) => character.id === characterId) ?? CHARACTER_CHOICES[0];
}

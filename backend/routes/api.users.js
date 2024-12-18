import { Router } from "express";
import {
  getUserByName,
  getFriends,
  addFriend,
  addPetToFavorites,
  removePetFromFavorites,
  create,
  getUserById,
} from "../database/models/userInfo.js";
import { get } from "../database/models/petModel.js";
import { createClerkClient } from "@clerk/backend";
const router = Router();

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

router.get("/:userName", async (req, res) => {
  const { userName } = req.params;
  const user = await getUserByName(userName);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.status(200).json({ user });
});

router.get("/:userName/friends", async (req, res) => {
  const { userName } = req.params;
  const user = await getUserByName(userName);
  if (!user) return res.status(404).json({ error: "User not found" });

  const friends = await getFriends(user.userId);
  const results = []

  for (let i = 0; i < friends.length; i++) {
    const friend = await clerkClient.users.getUser(friends[i]);
    if(!friend)  continue;
    results.push(friend);
  }
  return res.status(200).json(results);
});

router.post("/", async (req, res) => {
  const data = req.body;
  try {
    await create(data);
    res.json("User saved to database!");
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.post("/addFriend", async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    console.log(`Request to add friend: ${userId} -> ${friendId}`);

    if (userId === friendId) {
      return res.status(422).json({ error: "You can't friend yourself." });
    }

    const [user, friend] = await Promise.all([
      getUserByName(userId),
      getUserByName(friendId),
    ]);
    if (!user || !friend) {
      return res.status(404).json({ error: "User or friend not found." });
    }
    console.log(`Request to add friend: ${user.userId} -> ${friend.userId}`);

    const existingFriendship = await getFriends(user.userId);
    console.log(`Existing friendship: ${existingFriendship}`);

    if (existingFriendship.includes(friend.userId)) {
      return res.status(422).json({ error: "Friendship already exists." });
    }

    addFriend(user, friend);

    return res
      .status(200)
      .json({ message: "Friend added successfully.", friendId });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.post("/addFavorite", async (req, res) => {
    try {
        const { userId, petId } = req.body;

        if (!userId || !petId) {
            return res.status(400).json({ error: "Missing userId or petId" });
        }

        const updatedFavorites = await addPetToFavorites(userId, petId);
        res.status(200).json({ message: "Pet added to favorites", favorites: updatedFavorites });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/removePetFromFavorites", async (req, res) => {
    try {
        const { userId, petId } = req.body;

        if (!userId || !petId) {
            return res.status(400).json({ error: "Missing userId or petId" });
        }

        const updatedFavorites = await removePetFromFavorites(userId, petId);
        res.status(200).json({ message: "Pet removed from favorites", favorites: updatedFavorites });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/getFavorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const favorites = user.favorites;//array of pet ids
    const pets = [];

    for (let i = 0; i < favorites.length; i++) {
      const pet = await get(favorites[i]);
      if (pet) {
        pets.push(pet);
      }
    }

    res.status(200).json({ pets });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


export default router;

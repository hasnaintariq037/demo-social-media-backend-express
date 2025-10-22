import { Types } from "mongoose";

export const isPostOwner = (userId: Types.ObjectId, post: any) => {
  if (!post.author.equals(userId)) {
    return false;
  } else {
    return true;
  }
};

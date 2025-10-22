import mongoose, { Schema, Document, Types } from "mongoose";

export interface Post extends Document {
  author: Types.ObjectId;
  content: string;
  media?: string[];
  likes: Types.ObjectId[];
  shares: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema: Schema<Post> = new Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    media: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    shares: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true }
);

const Post = mongoose.model<Post>("Post", postSchema);

export default Post;

import { ObjectId } from "mongodb";

export type Image = {
  _id: ObjectId; // private id
  imageId: string; // public id

  title: string;
  imageDriveId: string;
  optimizedImageDriveId: string;

  context: {
    author: string;
    mimetype: string;
  };
  visit?: number;

  createAt: string;
  deleted?: boolean;
  deleteAt?: string;
};

export type User = {
  _id: ObjectId; // private id
  username: string; // public id

  email: string; // it will be change to using branded type
  password: string; // hashed string
  createAt: string;

  avatarUrl?: string;
  displayName?: string;

  deleted?: boolean;
  deleteAt?: string;
  updatedAt?: string;
};

export type Entities = {
  images: Image;
  users: User;
};

export type PartialEntity<T extends keyof Entities> = Partial<Entities[T]>;

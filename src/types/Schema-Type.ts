import { ObjectId } from "mongodb";

export type Image = {
  _id: ObjectId; // private id
  imageId: string; // public id

  title: string;
  imageDriveId: string;
  optimizedImageDriveId: string;

  context: {
    imageSize?: [number, number];
    author: string;
    authorUsername: string;
    mimetype: string;
  };
  visit?: number;
  isPrivate?: boolean;

  createAt: string;
  deleted?: boolean;
  deleteAt?: string;
};

export const ImageDefault: Image = {
  _id: new ObjectId(),
  context: { 
    author: '',
    authorUsername: '',
    mimetype: '',
    imageSize: [0,0]
  },
  createAt: '',
  imageDriveId: '',
  imageId: '',
  optimizedImageDriveId: '',
  title: '',
  deleteAt: '',
  deleted: false,
  isPrivate: false,
  visit: 0
}

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

export const UserDefault: User = {
  _id: new ObjectId(),
  createAt: '',
  email: '',
  password: '',
  username: '',
  avatarUrl: '',
  deleteAt: '',
  deleted: false,
  displayName: '',
  updatedAt: '',
}

export type PartialEntity<T extends keyof Entities> = Partial<Entities[T]>;

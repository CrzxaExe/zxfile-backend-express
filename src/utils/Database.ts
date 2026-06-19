import {
  Abortable,
  FindOneAndDeleteOptions,
  FindOneAndUpdateOptions,
  FindOneOptions,
  FindOptions,
  InsertManyResult,
  InsertOneResult,
  MongoClient,
  ObjectId,
  ServerApiVersion,
  WithId,
} from "mongodb";
import { Terminal } from "./Terminal";
import { Entities, PartialEntity, User } from "../types/Schema-Type";
import bcrypt from "bcryptjs";

let connection: MongoClient | null = null;

class UniversalDatabase {
  /**
   * Adding one item to database collection
   * @param collection name of collection
   * @param data object to store
   * @returns result of operation
   */
  static async addOne<T>(
    collection: string,
    data: Omit<T, "_id">,
  ): Promise<InsertOneResult<Document> | undefined> {
    if (!connection) await Database.Connect();

    try {
      const col = connection?.db(process.env.APP_NAME!).collection(collection);

      const result = await col?.insertOne({
        _id: ObjectId.createFromTime(Date.now()),
        ...data,
      } as any);

      return result;
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Adding multiple items to database collection
   * @param collection name of collection
   * @param data object to store
   * @returns result of operation
   */
  static async addMany<T>(
    collection: string,
    data: Omit<T, "_id">[],
  ): Promise<InsertManyResult<Document> | undefined> {
    if (!connection) await Database.Connect();

    try {
      const col = connection?.db(process.env.APP_NAME!).collection(collection);
      const newData = data.map((e) => {
        const obj = {
          _id: ObjectId.createFromTime(Date.now()),
          ...e,
        };

        return obj;
      });

      const result = await col?.insertMany(newData as any[]);

      return result;
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Find one item from database
   * @param collection name of collection
   * @param finder finder object
   * @param options options of operation, optional
   * @returns Data or undefined
   */
  static async findOne<T extends keyof Entities>(
    collection: T,
    finder: PartialEntity<T>,
    options: Omit<FindOneOptions, "timeoutMode"> & Abortable = {},
  ): Promise<Entities[T] | undefined> {
    if (!connection) await Database.Connect();

    try {
      const col = connection?.db(process.env.APP_NAME!).collection(collection);

      const res = await col?.findOne(finder as any, options);

      return res as Entities[T];
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Find multiple items from database
   * @param collection name of collection
   * @param finder finder object
   * @param options options of operation, optional
   * @returns Data or undefined
   */
  static async findMany<T extends keyof Entities>(
    collection: T,
    finder: PartialEntity<T>,
    options: FindOptions | Abortable = {},
  ): Promise<WithId<Entities[T]>[] | undefined> {
    if (!connection) await Database.Connect();

    try {
      const col = connection?.db(process.env.APP_NAME!).collection(collection);

      const keys = Object.keys(finder);
      const query: Record<string, any> = {
        deleted: { $ne: true },
      };

      keys.forEach((e) => {
        query[e] = { $regex: finder[e as keyof typeof finder], $options: "i" };
      });

      const res = col?.find(query, options as FindOptions);

      if (!res) return;
      const result = [];

      for await (const doc of res) {
        result.push(doc);
      }

      return result as WithId<Entities[T]>[];
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Update one item from database collection with matching finder
   * @param collection name of collection
   * @param finder finder object
   * @param updated data have to be updated
   * @param options options of operation
   * @returns updated data
   */
  static async findOneAndUpdate<T extends keyof Entities>(
    collection: T,
    finder: PartialEntity<T>,
    updated: Partial<Entities[T]>,
    options: FindOneAndUpdateOptions & { includeResultMetadata: true } = {
      includeResultMetadata: true,
    },
  ): Promise<WithId<Entities[T]> | null | undefined> {
    if (!connection) await Database.Connect();

    try {
      const col = connection?.db(process.env.APP_NAME!).collection(collection);

      const res = (await col?.findOneAndUpdate(
        finder as any,
        { $set: updated },
        options,
      )) as WithId<Entities[T]> | null | undefined;

      return res;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete one item from database collection with matching finder
   * @param collection name of collection
   * @param finder finder object
   * @param options options of operation
   * @returns deleted data
   */
  static async findOneAndDelete<T extends keyof Entities>(
    collection: T,
    finder: PartialEntity<T>,
    options: FindOneAndDeleteOptions = {},
  ): Promise<WithId<Entities[typeof collection]> | null | undefined> {
    if (!connection) await Database.Connect();

    try {
      const col = connection?.db(process.env.APP_NAME!).collection(collection);

      const res = (await col?.findOneAndDelete(
        finder as any,
        options,
      )) as WithId<Entities[typeof collection]> | null | undefined;

      return res;
    } catch (error: unknown) {
      throw error;
    }
  }
}

class UserDatabase {
  /**
   * Adding one data to user database collection
   * @param data object to store
   * @returns result of operation
   */
  static async addOne(
    data: Omit<User, "_id">,
  ): Promise<InsertOneResult<Document> | undefined> {
    try {
      const result = UniversalDatabase.addOne<User>("users", {
        ...data,
        password: await bcrypt.hash(data.password, 8),
      });

      return result;
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Get user data from database by username
   * @param username user identifier name
   * @returns User data or undefined
   */
  static async findUsername(username: string): Promise<User[] | undefined> {
    try {
      const res = await Database.db.findMany("users", {
        username,
      } as Pick<User, "username">);

      return res as User[];
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Get user data from database
   * @param id user ObjectId string
   * @returns User data or undefined
   */
  static async findId(id: string): Promise<User | undefined> {
    try {
      const res = await Database.db.findOne("users", {
        _id: new ObjectId(id),
      } as Pick<User, "_id">);

      return res as User;
    } catch (error: unknown) {
      throw error;
    }
  }

  static async findOneAndupdate(
    model: Partial<
      Pick<User, "avatarUrl" | "displayName" | "password" | "email"> & {
        _id: string;
      }
    >,
  ): Promise<WithId<User> | null | undefined> {
    try {
      const _id = new ObjectId(model._id);

      if (model.password) model.password = await bcrypt.hash(model.password, 8);

      delete model._id;
      const res = await Database.db.findOneAndUpdate(
        "users",
        { _id } as Pick<User, "_id">,
        model as Partial<Pick<User, "avatarUrl" | "displayName" | "password">>,
      );

      return res as WithId<User> | null | undefined;
    } catch (error: unknown) {
      throw error;
    }
  }
}

/**
 * Utility class to handle database connection
 */
class Database {
  /**
   * Connect to Database
   * @param uri Mongodb uri
   * @returns Promise of mongoose connection
   */
  static async Connect(
    uri: string = process.env.MONGO_URI!,
  ): Promise<MongoClient> {
    try {
      if (connection) return connection;

      connection = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        retryWrites: true,
      });

      await connection.connect();

      Terminal.info("Successfully to connect to database");

      return connection;
    } catch (error: { message: string } | any) {
      Terminal.error("Database error:", error.message);

      throw error;
    }
  }

  /**
   * Close connection to Database
   */
  static async Close(): Promise<void> {
    try {
      if (!connection) return;

      await connection.close();

      connection = null;
      Terminal.info("Disconnected with database");
    } catch (error: { message: string } | any) {
      Terminal.error(error.message);
    }
  }

  ////////////////////////////////////////////////////
  // CRUD Methods
  ////////////////////////////////////////////////////

  /**
   * User CRUD
   */
  static user = UserDatabase;

  /**
   * Universal CRUD
   */
  static db = UniversalDatabase;
}

export { Database, connection };

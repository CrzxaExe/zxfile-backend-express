import { Entities, ImageDefault, UserDefault } from "../types/Schema-Type";

const defaultEntity = {
    images: ImageDefault,
    users: UserDefault,
}
class Schema {
    static keyFrom<T extends keyof Entities>(schema: T): ObjectKeys<Entities[T]>[] {
        return Object.keys(defaultEntity[schema]) as ObjectKeys<Entities[T]>[]
    }

    static keyFilter<T extends keyof Entities>(schema: T, fields: ObjectKeys<Entities[T]>[] = []): ObjectKeys<Entities[T]>[] {
        return this.keyFrom(schema).filter(item => !fields.includes(item))
    }
}

export { Schema };
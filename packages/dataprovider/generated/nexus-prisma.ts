import * as prisma from '@prisma/client';
import { core } from '@nexus/schema';
import { GraphQLResolveInfo } from 'graphql';

// Types helpers
  type IsModelNameExistsInGraphQLTypes<
  ReturnType extends any
> = ReturnType extends core.GetGen<'objectNames'> ? true : false;

type NexusPrismaScalarOpts = {
  alias?: string;
};

type Pagination = {
  first?: boolean;
  last?: boolean;
  before?: boolean;
  after?: boolean;
  skip?: boolean;
};

type RootObjectTypes = Pick<
  core.GetGen<'rootTypes'>,
  core.GetGen<'objectNames'>
>;

/**
 * Determine if `B` is a subset (or equivalent to) of `A`.
*/
type IsSubset<A, B> = keyof A extends never
  ? false
  : B extends A
  ? true
  : false;

type OmitByValue<T, ValueType> = Pick<
  T,
  { [Key in keyof T]: T[Key] extends ValueType ? never : Key }[keyof T]
>;

type GetSubsetTypes<ModelName extends any> = keyof OmitByValue<
  {
    [P in keyof RootObjectTypes]: ModelName extends keyof ModelTypes
      ? IsSubset<RootObjectTypes[P], ModelTypes[ModelName]> extends true
        ? RootObjectTypes[P]
        : never
      : never;
  },
  never
>;

type SubsetTypes<ModelName extends any> = GetSubsetTypes<
  ModelName
> extends never
  ? `ERROR: No subset types are available. Please make sure that one of your GraphQL type is a subset of your t.model('<ModelName>')`
  : GetSubsetTypes<ModelName>;

type DynamicRequiredType<ReturnType extends any> = IsModelNameExistsInGraphQLTypes<
  ReturnType
> extends true
  ? { type?: SubsetTypes<ReturnType> }
  : { type: SubsetTypes<ReturnType> };

type GetNexusPrismaInput<
  ModelName extends any,
  MethodName extends any,
  InputName extends 'filtering' | 'ordering'
> = ModelName extends keyof NexusPrismaInputs
  ? MethodName extends keyof NexusPrismaInputs[ModelName]
    ? NexusPrismaInputs[ModelName][MethodName][InputName]
    : never
  : never;

/**
 *  Represents arguments required by Prisma Client JS that will
 *  be derived from a request's input (args, context, and info)
 *  and omitted from the GraphQL API. The object itself maps the
 *  names of these args to a function that takes an object representing
 *  the request's input and returns the value to pass to the prisma
 *  arg of the same name.
 */
export type LocalComputedInputs<MethodName extends any> = Record<
  string,
  (params: LocalMutationResolverParams<MethodName>) => unknown
>

export type GlobalComputedInputs = Record<
  string,
  (params: GlobalMutationResolverParams) => unknown
>

type BaseMutationResolverParams = {
  info: GraphQLResolveInfo
  ctx: Context
}

export type GlobalMutationResolverParams = BaseMutationResolverParams & {
  args: Record<string, any> & { data: unknown }
}

export type LocalMutationResolverParams<
  MethodName extends any
> = BaseMutationResolverParams & {
  args: MethodName extends keyof core.GetGen2<'argTypes', 'Mutation'>
    ? core.GetGen3<'argTypes', 'Mutation', MethodName>
    : any
}

export type Context = core.GetGen<'context'>

type NexusPrismaRelationOpts<
  ModelName extends any,
  MethodName extends any,
  ReturnType extends any
> = GetNexusPrismaInput<
  // If GetNexusPrismaInput returns never, it means there are no filtering/ordering args for it.
  ModelName,
  MethodName,
  'filtering'
> extends never
  ? {
      alias?: string;
      computedInputs?: LocalComputedInputs<MethodName>;
    } & DynamicRequiredType<ReturnType>
  : {
      alias?: string;
      computedInputs?: LocalComputedInputs<MethodName>;
      filtering?:
        | boolean
        | Partial<
            Record<
              GetNexusPrismaInput<ModelName, MethodName, 'filtering'>,
              boolean
            >
          >;
      ordering?:
        | boolean
        | Partial<
            Record<
              GetNexusPrismaInput<ModelName, MethodName, 'ordering'>,
              boolean
            >
          >;
      pagination?: boolean | Pagination;
    } & DynamicRequiredType<ReturnType>;

type IsScalar<TypeName extends any> = TypeName extends core.GetGen<'scalarNames'>
  ? true
  : false;

type IsObject<Name extends any> = Name extends core.GetGen<'objectNames'>
  ? true
  : false

type IsEnum<Name extends any> = Name extends core.GetGen<'enumNames'>
  ? true
  : false

type IsInputObject<Name extends any> = Name extends core.GetGen<'inputNames'>
  ? true
  : false

/**
 * The kind that a GraphQL type may be.
 */
type Kind = 'Enum' | 'Object' | 'Scalar' | 'InputObject'

/**
 * Helper to safely reference a Kind type. For example instead of the following
 * which would admit a typo:
 *
 * ```ts
 * type Foo = Bar extends 'scalar' ? ...
 * ```
 *
 * You can do this which guarantees a correct reference:
 *
 * ```ts
 * type Foo = Bar extends AKind<'Scalar'> ? ...
 * ```
 *
 */
type AKind<T extends Kind> = T

type GetKind<Name extends any> = IsEnum<Name> extends true
  ? 'Enum'
  : IsScalar<Name> extends true
  ? 'Scalar'
  : IsObject<Name> extends true
  ? 'Object'
  : IsInputObject<Name> extends true
  ? 'InputObject'
  // FIXME should be `never`, but GQL objects named differently
  // than backing type fall into this branch
  : 'Object'

type NexusPrismaFields<ModelName extends keyof NexusPrismaTypes> = {
  [MethodName in keyof NexusPrismaTypes[ModelName]]: NexusPrismaMethod<
    ModelName,
    MethodName,
    GetKind<NexusPrismaTypes[ModelName][MethodName]> // Is the return type a scalar?
  >;
};

type NexusPrismaMethod<
  ModelName extends keyof NexusPrismaTypes,
  MethodName extends keyof NexusPrismaTypes[ModelName],
  ThisKind extends Kind,
  ReturnType extends any = NexusPrismaTypes[ModelName][MethodName]
> =
  ThisKind extends AKind<'Enum'>
  ? () => NexusPrismaFields<ModelName>
  : ThisKind extends AKind<'Scalar'>
  ? (opts?: NexusPrismaScalarOpts) => NexusPrismaFields<ModelName> // Return optional scalar opts
  : IsModelNameExistsInGraphQLTypes<ReturnType> extends true // If model name has a mapped graphql types
  ? (
      opts?: NexusPrismaRelationOpts<ModelName, MethodName, ReturnType>
    ) => NexusPrismaFields<ModelName> // Then make opts optional
  : (
      opts: NexusPrismaRelationOpts<ModelName, MethodName, ReturnType>
    ) => NexusPrismaFields<ModelName>; // Else force use input the related graphql type -> { type: '...' }

type GetNexusPrismaMethod<
  TypeName extends string
> = TypeName extends keyof NexusPrismaMethods
  ? NexusPrismaMethods[TypeName]
  : <CustomTypeName extends keyof ModelTypes>(
      typeName: CustomTypeName
    ) => NexusPrismaMethods[CustomTypeName];

type GetNexusPrisma<
  TypeName extends string,
  ModelOrCrud extends 'model' | 'crud'
> = ModelOrCrud extends 'model'
  ? TypeName extends 'Mutation'
    ? never
    : TypeName extends 'Query'
    ? never
    : GetNexusPrismaMethod<TypeName>
  : ModelOrCrud extends 'crud'
  ? TypeName extends 'Mutation'
    ? GetNexusPrismaMethod<TypeName>
    : TypeName extends 'Query'
    ? GetNexusPrismaMethod<TypeName>
    : never
  : never;
  

// Generated
interface ModelTypes {
  UserRole: prisma.UserRole
  UserSocialMedia: prisma.UserSocialMedia
  User: prisma.User
  SomePublicRecordWithIntId: prisma.SomePublicRecordWithIntId
}
  
interface NexusPrismaInputs {
  Query: {
    userRoles: {
  filtering: 'id' | 'name' | 'users' | 'AND' | 'OR' | 'NOT'
  ordering: 'id' | 'name'
}
    userSocialMedias: {
  filtering: 'id' | 'instagram' | 'twitter' | 'userId' | 'AND' | 'OR' | 'NOT' | 'user'
  ordering: 'id' | 'instagram' | 'twitter' | 'userId'
}
    users: {
  filtering: 'id' | 'email' | 'roles' | 'firstName' | 'lastName' | 'gender' | 'yearOfBirth' | 'wantsNewsletter' | 'AND' | 'OR' | 'NOT' | 'userSocialMedia'
  ordering: 'id' | 'email' | 'firstName' | 'lastName' | 'gender' | 'yearOfBirth' | 'wantsNewsletter'
}
    somePublicRecordWithIntIds: {
  filtering: 'id' | 'title' | 'AND' | 'OR' | 'NOT'
  ordering: 'id' | 'title'
}

  },
    UserRole: {
    users: {
  filtering: 'id' | 'email' | 'roles' | 'firstName' | 'lastName' | 'gender' | 'yearOfBirth' | 'wantsNewsletter' | 'AND' | 'OR' | 'NOT' | 'userSocialMedia'
  ordering: 'id' | 'email' | 'firstName' | 'lastName' | 'gender' | 'yearOfBirth' | 'wantsNewsletter'
}

  },  UserSocialMedia: {


  },  User: {
    roles: {
  filtering: 'id' | 'name' | 'users' | 'AND' | 'OR' | 'NOT'
  ordering: 'id' | 'name'
}

  },  SomePublicRecordWithIntId: {


  }
}

interface NexusPrismaTypes {
  Query: {
    userRole: 'UserRole'
    userRoles: 'UserRole'
    userSocialMedia: 'UserSocialMedia'
    userSocialMedias: 'UserSocialMedia'
    user: 'User'
    users: 'User'
    somePublicRecordWithIntId: 'SomePublicRecordWithIntId'
    somePublicRecordWithIntIds: 'SomePublicRecordWithIntId'

  },
  Mutation: {
    createOneUserRole: 'UserRole'
    updateOneUserRole: 'UserRole'
    updateManyUserRole: 'BatchPayload'
    deleteOneUserRole: 'UserRole'
    deleteManyUserRole: 'BatchPayload'
    upsertOneUserRole: 'UserRole'
    createOneUserSocialMedia: 'UserSocialMedia'
    updateOneUserSocialMedia: 'UserSocialMedia'
    updateManyUserSocialMedia: 'BatchPayload'
    deleteOneUserSocialMedia: 'UserSocialMedia'
    deleteManyUserSocialMedia: 'BatchPayload'
    upsertOneUserSocialMedia: 'UserSocialMedia'
    createOneUser: 'User'
    updateOneUser: 'User'
    updateManyUser: 'BatchPayload'
    deleteOneUser: 'User'
    deleteManyUser: 'BatchPayload'
    upsertOneUser: 'User'
    createOneSomePublicRecordWithIntId: 'SomePublicRecordWithIntId'
    updateOneSomePublicRecordWithIntId: 'SomePublicRecordWithIntId'
    updateManySomePublicRecordWithIntId: 'BatchPayload'
    deleteOneSomePublicRecordWithIntId: 'SomePublicRecordWithIntId'
    deleteManySomePublicRecordWithIntId: 'BatchPayload'
    upsertOneSomePublicRecordWithIntId: 'SomePublicRecordWithIntId'

  },
  UserRole: {
    id: 'String'
    name: 'String'
    users: 'User'

},  UserSocialMedia: {
    id: 'String'
    instagram: 'String'
    twitter: 'String'
    user: 'User'
    userId: 'String'

},  User: {
    id: 'String'
    email: 'String'
    roles: 'UserRole'
    firstName: 'String'
    lastName: 'String'
    gender: 'Gender'
    yearOfBirth: 'Int'
    wantsNewsletter: 'Boolean'
    userSocialMedia: 'UserSocialMedia'

},  SomePublicRecordWithIntId: {
    id: 'Int'
    title: 'String'

}
}

interface NexusPrismaMethods {
  UserRole: NexusPrismaFields<'UserRole'>
  UserSocialMedia: NexusPrismaFields<'UserSocialMedia'>
  User: NexusPrismaFields<'User'>
  SomePublicRecordWithIntId: NexusPrismaFields<'SomePublicRecordWithIntId'>
  Query: NexusPrismaFields<'Query'>
  Mutation: NexusPrismaFields<'Mutation'>
}
  

declare global {
  type NexusPrisma<
    TypeName extends string,
    ModelOrCrud extends 'model' | 'crud'
  > = GetNexusPrisma<TypeName, ModelOrCrud>;
}
  
import { PrismaClient } from '@prisma/client';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { lcfirst, __ } from '../../app/helpers/functions';

export function Unique(
  prismaModel: string,
  validationOptions?: ValidationOptions,
) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [prismaModel],
      validator: UniqueConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'Unique' })
export class UniqueConstraint implements ValidatorConstraintInterface {
  private prisma = new PrismaClient();
  async validate(value: any, args: ValidationArguments) {
    let [client] = args.constraints;
    client = lcfirst(client);
    const column = args.property;
    const where = {};
    where[column] = value;
    try {
      if (!value) return true;
      const data = await this.prisma[client].findFirst({
        where: where,
      });
      return data ? false : true;
    } catch (e) {
      console.error(
        `Can't find '${args.constraints[0]}' prisma model or column '${column}'.`,
      );
      throw e;
    }
  }

  defaultMessage?(args?: ValidationArguments): string {
    return `${args.property} ` + __('already exists.');
  }
}

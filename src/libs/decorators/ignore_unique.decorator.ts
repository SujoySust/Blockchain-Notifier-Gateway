import { PrismaClient } from '@prisma/client';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { lcfirst, __ } from '../../app/helpers/functions';

function IgnoreUnique(
  data: {
    model: string;
    column: string;
    ignoreColumn: string;
  },
  validationOptions?: ValidationOptions,
) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [data.model, data.column, data.ignoreColumn],
      validator: ExistsConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'IgnoreUnique' })
export class ExistsConstraint implements ValidatorConstraintInterface {
  private prisma = new PrismaClient();
  async validate(value: any, args: ValidationArguments) {
    let [client] = args.constraints;
    client = lcfirst(client);
    const column = args.constraints[1];
    const columnIgnore = args.constraints[2];
    const where = {};
    where[column] = value;
    const ignoredValue = args.object[columnIgnore];
    try {
      const data = await this.prisma[client].findFirst({
        where: {
          NOT: {
            id: ignoredValue,
          },
          ...where,
        },
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

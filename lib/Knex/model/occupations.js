// /lib/Knex/model/occupations.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Occupations extends Model {
  static tableName = 'occupations';
  static idColumn = 'occupation_id';
}

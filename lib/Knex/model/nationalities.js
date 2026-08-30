// /lib/Knex/model/nationalities.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Nationalities extends Model {
  static tableName = 'nationalities';
  static idColumn = 'nationalities_id';
}

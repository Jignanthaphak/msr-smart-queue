// /lib/Knex/model/name_prefixes.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Name_prefixes extends Model {
  static tableName = 'name_prefixes';
  static idColumn = 'prefix_id';
}

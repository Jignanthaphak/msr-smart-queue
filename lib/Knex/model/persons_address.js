// /lib/Knex/model/persons_address.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Provinces from "@/lib/Knex/model/provinces";
import Districts from "@/lib/Knex/model/districts";
import Subdistricts from "@/lib/Knex/model/subdistricts";

export default class PersonsAddress extends Model {
  static tableName = 'persons_address';
  static idColumn = 'hn';

  static relationMappings = {
    province: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Provinces,
      join: {
        from: 'persons_address.province_id',
        to: 'provinces.id',
      },
    },
    district: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Districts,
      join: {
        from: 'persons_address.district_id',
        to: 'districts.id',
      },
    },
    subdistrict: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Subdistricts,
      join: {
        from: 'persons_address.subdistrict_id',
        to: 'subdistricts.id',
      },
    },
  };
}


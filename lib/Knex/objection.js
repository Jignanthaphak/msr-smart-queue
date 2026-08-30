// /lib/Knex/objection.js
import "server-only";
import { Model } from "objection";
import knexConfig from "@/lib/Knex/dbKnex.js";

Model.knex(knexConfig);

export default Model;

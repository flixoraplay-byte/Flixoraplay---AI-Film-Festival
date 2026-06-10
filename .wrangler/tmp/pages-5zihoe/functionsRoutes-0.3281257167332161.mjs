import { onRequestGet as __api_competitions__id__js_onRequestGet } from "D:\\flixoraplay\\functions\\api\\competitions\\[id].js"
import { onRequestOptions as __api_competitions__id__js_onRequestOptions } from "D:\\flixoraplay\\functions\\api\\competitions\\[id].js"
import { onRequestPut as __api_competitions__id__js_onRequestPut } from "D:\\flixoraplay\\functions\\api\\competitions\\[id].js"
import { onRequestGet as __api_entries__id__js_onRequestGet } from "D:\\flixoraplay\\functions\\api\\entries\\[id].js"
import { onRequestOptions as __api_entries__id__js_onRequestOptions } from "D:\\flixoraplay\\functions\\api\\entries\\[id].js"
import { onRequestPut as __api_entries__id__js_onRequestPut } from "D:\\flixoraplay\\functions\\api\\entries\\[id].js"
import { onRequestOptions as __api_auth_js_onRequestOptions } from "D:\\flixoraplay\\functions\\api\\auth.js"
import { onRequestPost as __api_auth_js_onRequestPost } from "D:\\flixoraplay\\functions\\api\\auth.js"
import { onRequestGet as __api_competitions_js_onRequestGet } from "D:\\flixoraplay\\functions\\api\\competitions.js"
import { onRequestOptions as __api_competitions_js_onRequestOptions } from "D:\\flixoraplay\\functions\\api\\competitions.js"
import { onRequestPost as __api_competitions_js_onRequestPost } from "D:\\flixoraplay\\functions\\api\\competitions.js"
import { onRequestGet as __api_entries_js_onRequestGet } from "D:\\flixoraplay\\functions\\api\\entries.js"
import { onRequestOptions as __api_entries_js_onRequestOptions } from "D:\\flixoraplay\\functions\\api\\entries.js"
import { onRequestPost as __api_entries_js_onRequestPost } from "D:\\flixoraplay\\functions\\api\\entries.js"
import { onRequestGet as __api_leaderboard_js_onRequestGet } from "D:\\flixoraplay\\functions\\api\\leaderboard.js"
import { onRequestOptions as __api_leaderboard_js_onRequestOptions } from "D:\\flixoraplay\\functions\\api\\leaderboard.js"
import { onRequestOptions as __api_votes_js_onRequestOptions } from "D:\\flixoraplay\\functions\\api\\votes.js"
import { onRequestPost as __api_votes_js_onRequestPost } from "D:\\flixoraplay\\functions\\api\\votes.js"

export const routes = [
    {
      routePath: "/api/competitions/:id",
      mountPath: "/api/competitions",
      method: "GET",
      middlewares: [],
      modules: [__api_competitions__id__js_onRequestGet],
    },
  {
      routePath: "/api/competitions/:id",
      mountPath: "/api/competitions",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_competitions__id__js_onRequestOptions],
    },
  {
      routePath: "/api/competitions/:id",
      mountPath: "/api/competitions",
      method: "PUT",
      middlewares: [],
      modules: [__api_competitions__id__js_onRequestPut],
    },
  {
      routePath: "/api/entries/:id",
      mountPath: "/api/entries",
      method: "GET",
      middlewares: [],
      modules: [__api_entries__id__js_onRequestGet],
    },
  {
      routePath: "/api/entries/:id",
      mountPath: "/api/entries",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_entries__id__js_onRequestOptions],
    },
  {
      routePath: "/api/entries/:id",
      mountPath: "/api/entries",
      method: "PUT",
      middlewares: [],
      modules: [__api_entries__id__js_onRequestPut],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_js_onRequestOptions],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_js_onRequestPost],
    },
  {
      routePath: "/api/competitions",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_competitions_js_onRequestGet],
    },
  {
      routePath: "/api/competitions",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_competitions_js_onRequestOptions],
    },
  {
      routePath: "/api/competitions",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_competitions_js_onRequestPost],
    },
  {
      routePath: "/api/entries",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_entries_js_onRequestGet],
    },
  {
      routePath: "/api/entries",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_entries_js_onRequestOptions],
    },
  {
      routePath: "/api/entries",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_entries_js_onRequestPost],
    },
  {
      routePath: "/api/leaderboard",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_leaderboard_js_onRequestGet],
    },
  {
      routePath: "/api/leaderboard",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_leaderboard_js_onRequestOptions],
    },
  {
      routePath: "/api/votes",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_votes_js_onRequestOptions],
    },
  {
      routePath: "/api/votes",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_votes_js_onRequestPost],
    },
  ]
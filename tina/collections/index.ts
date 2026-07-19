import type { Collection } from "tinacms";
import { TinaUserCollection } from "tinacms-authjs/dist/tinacms";
import { home } from "./home";
import { about } from "./about";
import { pottery } from "./pottery";
import { process_ } from "./process";
import { contact } from "./contact";
import { collectionsPage } from "./collectionsPage";
import { retail } from "./retail";
import { privacy } from "./privacy";
import { eventsPage } from "./eventsPage";
import { faqPage } from "./faqPage";
import { global } from "./global";
import { seo } from "./seo";
import { events } from "./events";
import { news } from "./news";
import { gallery } from "./gallery";
import { features } from "./features";
import { faqSections } from "./faqSections";

export const collections: Collection[] = [
  home,
  about,
  pottery,
  process_,
  contact,
  collectionsPage,
  retail,
  privacy,
  eventsPage,
  faqPage,
  global,
  seo,
  events,
  news,
  gallery,
  features,
  faqSections,
  TinaUserCollection as unknown as Collection,
];

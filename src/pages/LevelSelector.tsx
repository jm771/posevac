import { createClient } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Database } from "../database.types";
import { Level, WorldMap, WORLDS } from "../levels";
import { NotNull } from "../util";

function LevelCard({ level }: { level: Level }) {
  const navigate = useNavigate();
  return (
    <div className="level-card" data-level-id={level.id}>
      <h3>{level.name}</h3>
      <p>{level.description}</p>
      <button
        className="play-button"
        onClick={() => navigate(`/level/${level.id}`)}
      >
        Play
      </button>
    </div>
  );
}

export function LevelSelector() {
  useEffect(() => {
    const func = async () => {
      const supabaseUrl = "https://acfkhtypgniwpismakxo.supabase.co";

      const annon_key =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZmtodHlwZ25pd3Bpc21ha3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjQ4MjIsImV4cCI6MjA3ODQ0MDgyMn0.7lgMQQuyiffHAQKDiqm6aTqUGzGs4Dn8vfQQmBATuEA";
      const supabase = createClient<Database>(supabaseUrl, annon_key);
      // const savesQuery = supabase
      //   .from("saves")
      //   .select("*")
      //   .eq("level", level)
      //   .order("id", { ascending: false })
      //   .limit(10); //.limit(1);
      // const saves: QueryData<typeof savesQuery> = NotNull(
      //   (await savesQuery).data
      // );

      // saves.concat;
      // console.log(saves);

      // TODO: Change the table_name to your table
      const { data, error } = await supabase
        .from("saves")
        .select("*")
        .eq("level", "addition")
        .order("id", {
          ascending: false,
        })
        .limit(10);

      console.log(data, error);
    };
    func();
  }, []);

  // type CountriesWithCities = QueryData<typeof countriesWithCitiesQuery>;const { data, error } = await countriesWithCitiesQuery;if (error) throw error;const countriesWithCities: CountriesWithCities = data;


   const [selectedWorldIdx, setSelectedWorldIdx] = useState(0);
   const posMod =
     ((selectedWorldIdx % WORLDS.length) + WORLDS.length) % WORLDS.length;
   const world = WORLDS[posMod];
   const levels = NotNull(WorldMap.get(world.key));

  return (
    <>
      <div className="world-header">
        <div className="world-info">
          <h1 className="world-title">{world.title}</h1>
          <p className="world-description">{world.descrption}</p>
        </div>
        <div className="world-navigation">
          <button
            onClick={() => setSelectedWorldIdx((x) => x - 1)}
            className="world-nav-arrow"
            aria-label="Previous world"
          >
            ◄
          </button>
          <span className="world-counter">
            {posMod + 1} / {WORLDS.length}
          </span>
          <button
            onClick={() => setSelectedWorldIdx((x) => x + 1)}
            className="world-nav-arrow"
            aria-label="Next world"
          >
            ►
          </button>
        </div>
      </div>
      <div className="levels-grid">
        {levels.map((l: Level) => (
          <LevelCard key={l.id} level={l} />
        ))}
      </div>
    </>
  );
}

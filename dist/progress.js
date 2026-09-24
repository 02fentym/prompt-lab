/** Remap stored numeric indexes through stable mission identities when lessons move.
 * The v1 ordering is retained for learners saved before identity metadata existed.
 * Never mutate the saved object: its original localStorage entry remains recoverable
 * until the caller saves the migrated result successfully.
 */
export function migrateProgress(saved, missions, legacyMissionIds) {
  const fresh = {
    completed: [],
    sessions: {},
    seconds: 0,
    days: [],
    missionIds: missions.map((m) => m.id),
  };
  if (
    !saved ||
    !Array.isArray(saved.completed) ||
    !saved.sessions ||
    !Array.isArray(saved.days)
  )
    return { state: fresh, indexMap: [] };
  const previous = saved.missionIds || legacyMissionIds;
  const indexMap = previous.map((id) => fresh.missionIds.indexOf(id));
  const mapIndex = (value) =>
    Number.isInteger(Number(value)) ? indexMap[Number(value)] : -1;
  fresh.completed = [
    ...new Set(saved.completed.map(mapIndex).filter((i) => i >= 0)),
  ];
  for (const [oldIndex, session] of Object.entries(saved.sessions)) {
    const next = mapIndex(oldIndex);
    if (next >= 0) fresh.sessions[next] = session;
  }
  fresh.seconds = Number.isFinite(saved.seconds)
    ? Math.max(0, saved.seconds)
    : 0;
  fresh.days = saved.days.filter((d) => typeof d === "string");
  return { state: fresh, indexMap };
}

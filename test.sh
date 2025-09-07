prev_map=$(npm query .workspace | jq -c 'map({key:.name, value:.version}) | from_entries')

changed=$(
  jq -nc --argjson prev "null" --argjson curr "$prev_map" '
    [ ($curr // {}) as $c
    | ($prev // {}) as $p
    | $c
    | to_entries[]
    | select(.value != ($p[.key] // null))
    | {name: .key, version: .value}
    ]'
)

todo='[]'

# Iterate changed [{name,version}] and probe npm
while IFS=$'\t' read -r name version; do
  if npm view "${name}@${version}" version >/dev/null 2>&1; then
    echo "skip: ${name}@${version} (already published)"
  else
    # Accumulate into todo
    todo=$(jq -c --arg name "$name" --arg version "$version" \
      '. + [{name:$name, version:$version}]' <<<"$todo")
    echo "will publish: ${name}@${version}"
  fi
done < <(jq -r '.[] | [.name, .version] | @tsv' <<<"$changed")

matrix=$(jq -nc --argjson list "$todo" '
  { include: [ $list[] | { workspace: .name, version: .version } ] }
')

printf 'matrix=%s\n' "$matrix" >> "$GITHUB_OUTPUT"

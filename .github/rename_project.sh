
#!/usr/bin/env bash
while getopts a:n:u:d: flag
do
    case "${flag}" in
        a) author=${OPTARG};;
        n) name=${OPTARG};;
        u) urlname=${OPTARG};;
        d) description=${OPTARG};;
    esac
done

echo "Author: $author";
echo "Project Name: $name";
echo "Project URL name: $urlname";
echo "Description: $description";

cameCase=$(sed -r 's/(^|-)(\w)/\U\2/g' <<<"$urlname")
namespace="namespace $cameCase"
plugin="new $cameCase.Plugin()"
settings="IPlugin$cameCase"
pageid=$(sed 's/[a-z ]//g' <<< "$cameCase")

echo "$cameCase $namespace $settings $pageid"


echo "Renaming project..."

original_author="MatrixRequirements"
original_name="matrix-ui-plugin-boilerplate"
original_description="Awesome matrix-ui-plugin-boilerplate created by francoischasseur"
original_setting="IPluginBoilerPlate"
original_namespace="namespace BoilerPlate"
original_plugin="new BoilerPlate.Plugin()"
original_pageid="BPP"

for filename in $(git ls-files) 
do
    echo "Processing $filename"
   [[ $filename = .github* ]] &&  echo "Skipping $filename"
   [[ $filename != .github* ]] &&  sed -i "s/$original_name/$name/g" "$filename"
   [[ $filename != .github* ]] &&  sed -i "s/$original_author/$author/g" "$filename"
   [[ $filename != .github* ]] &&  sed -i "s/$original_description/$description/g" "$filename"
   [[ $filename != .github* ]] &&  sed -i "s/$original_setting/$settings/g" "$filename"
   [[ $filename != .github* ]] &&  sed -i "s/$original_namespace/$namespace/g" "$filename"
   [[ $filename != .github* ]] &&  sed -i "s/$original_pageid/$pageid/g" "$filename"
   [[ $filename != .github* ]] &&  sed -i "s/$original_plugin/$plugin/g" "$filename"
   [[ $filename != .github* ]] &&  echo "$filename fixed"
 
done


# This command runs only once on GHA!

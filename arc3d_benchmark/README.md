# ARC3D Benchmark

Run one ARC3D task at a time from rendered puzzle images using Azure OpenAI.

```sh
export AZURE_OPENAI_API_KEY="..."
python3 -m arc3d_benchmark.benchmark_main --task 1
```

The Azure Responses URL and the `gpt-5.6-sol` deployment are configured in
`arc3d_benchmark/config.py`. Only the API key is read from the environment.
You can still override the deployment with `--model` and the URL with
`--azure-endpoint`.

## One-image token test

Before running a full benchmark, send one image and print the model description
and the API-reported token usage:

```sh
python3 -m arc3d_benchmark.azure_image_test
```

The default image is `rendered_puzzle_images/task1/test/face-nz.png`. Select a
different image or detail level when needed:

```sh
python3 -m arc3d_benchmark.azure_image_test \
  --image rendered_puzzle_images/task2/test/corner-px-py-pz.png \
  --image-detail high \
  --max-output-tokens 300
```

Add `--save-response /tmp/arc3d-image-response.json` to retain the complete
Azure JSON response. The script never runs evaluation or writes a benchmark result.

The default output cap is 20,000 tokens so reasoning has room to finish. Override
it when running:

```sh
python3 -m arc3d_benchmark.benchmark_main --task 1 --max-output-tokens 30000
```

Use `--dry-run` to validate loading and prompt construction without calling the API.

The prompt declares the exact fixed-view order, and every image is immediately
preceded by a matching label such as `View 1/14: face-px`. The current input
policy is `--view-policy all`, which sends all 14 fixed views
for each example and the test. `--view-policy neg-z-first` is a placeholder for a
future interactive protocol where the model starts from `face-nz` and asks for
additional views by action.

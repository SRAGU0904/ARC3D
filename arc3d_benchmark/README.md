# ARC3D Benchmark

Run one ARC3D task at a time from rendered puzzle images.

```sh
export OPENAI_API_KEY="..."
python3 benchmark_main.py --task 1 --model gpt-5.6-sol
```

The default output cap is 64 tokens. Override it when running:

```sh
python3 benchmark_main.py --task 1 --model gpt-5.6-sol --max-output-tokens 128
```

Use `--dry-run` to validate loading and prompt construction without calling the API.

The current input policy is `--view-policy all`, which sends all 14 fixed views
for each example and the test. `--view-policy neg-z-first` is a placeholder for a
future interactive protocol where the model starts from `face-nz` and asks for
additional views by action.

# ARC3D Work Transfer Notes

更新时间：2026-09-02

这份文档用于把当前 Codex 账号里的 ARC3D 工作记录迁移到新的工作电脑/新 Codex 账号后继续使用。

## 项目位置

当前项目在：

```sh
/Users/ruyinfeng/Desktop/axa repo/ARC3D
```

建议迁移时直接复制整个 `ARC3D` 文件夹，包括：

- `task1/`, `task2/`, `task3/`
- `rendered_puzzle_images/`
- `arc3d_benchmark/`
- `arc3d_benchmark/benchmark_main.py`
- `benchmark_results/`
- `README.md`
- `ARC3D_WORK_TRANSFER.md`

不要迁移或公开：

- `AZURE_OPENAI_API_KEY`
- 任何本地 shell history 里的 key

## 当前项目目标

ARC3D 是一个受 ARC 启发的 3D puzzle benchmark。当前包含 3 个 3D puzzle task，用于测试 AI model 对 3D 结构、视角、空间补全/选择题的推理能力。

每个 task 当前有：

- `example1`
- `example2`
- `test`

输入形式主要是图片：每个 puzzle 使用 fixed view 渲染后的 14 张图，包括：

- 6 个面视角：`face-px`, `face-nx`, `face-py`, `face-ny`, `face-pz`, `face-nz`
- 8 个顶点视角：`corner-nx-py-pz`, `corner-px-py-pz`, `corner-nx-ny-pz`, `corner-px-ny-pz`, `corner-nx-py-nz`, `corner-px-py-nz`, `corner-nx-ny-nz`, `corner-px-ny-nz`

## 已完成工作

### 1. Fixed View 网页模式

`task1`, `task2`, `task3` 的网页现在支持两类 view：

- `free`
- `fixed`

fixed view 中包含 14 个固定视角。

网页里还增加了导出相关支持：

```text
?export=fixed&puzzle=example1&view=face-px
```

导出模式会隐藏网页 UI，只保留 puzzle canvas，避免截图时带上按钮、箭头、顶部栏、底部栏等。

当前 git 状态里相关修改主要在：

- `task1/index.html`
- `task1/main.js`
- `task2/index.html`
- `task2/main.js`
- `task3/index.html`
- `task3/main.js`

### 2. 渲染图

渲染图目录：

```sh
rendered_puzzle_images/
```

当前结构：

```text
rendered_puzzle_images/
  manifest.json
  task1/
    example1/
    example2/
    test/
  task2/
    example1/
    example2/
    test/
  task3/
    example1/
    example2/
    test/
```

每个 puzzle 文件夹内有：

- 14 张 `.png`
- 1 个 `answer.txt`

已验证：

- PNG 总数：126
- `answer.txt` 总数：9
- 所有 PNG 尺寸：`1024x1024`
- 图片只包含 puzzle 渲染，不包含网页 UI 或 fixed-view 箭头
- task2 和 task3 的图片状态良好
- `task1/example1` 已在 2026-09-02 重新生成

`task1/example1/answer.txt` 当前为：

```text
A,C,D
```

### 3. Benchmark 程序

Benchmark 程序位于：

```text
arc3d_benchmark/
```

模块结构：

- `arc3d_benchmark/benchmark_main.py`：命令行入口，配置 task、model、token 上限、view policy 等
- `arc3d_benchmark/config.py`：默认配置，包括 14 个 fixed view、默认 token 上限
- `arc3d_benchmark/dataset.py`：读取图片和 `answer.txt`
- `arc3d_benchmark/examples.py`：组织 examples
- `arc3d_benchmark/test_input.py`：组织 test input
- `arc3d_benchmark/payload.py`：把本地图片编码成 API payload
- `arc3d_benchmark/prompts.py`：构建给模型的 prompt
- `arc3d_benchmark/model_client.py`：调用 Azure OpenAI Responses API v1
- `arc3d_benchmark/evaluation.py`：解析模型答案并评估正确性
- `arc3d_benchmark/runner.py`：串联 load -> prompt -> model -> evaluation -> result

## 如何运行 Benchmark

进入 ARC3D 根目录：

```sh
cd "/Users/ruyinfeng/Desktop/axa repo/ARC3D"
```

设置 Azure OpenAI API key（endpoint 和 deployment 已写在 `arc3d_benchmark/config.py`）：

```sh
export AZURE_OPENAI_API_KEY="你的 Azure OpenAI API key"
```

运行 task1：

```sh
python3 -m arc3d_benchmark.benchmark_main --task 1
```

运行 task2：

```sh
python3 -m arc3d_benchmark.benchmark_main --task 2
```

运行 task3：

```sh
python3 -m arc3d_benchmark.benchmark_main --task 3
```

设置输出 token 上限：

```sh
python3 -m arc3d_benchmark.benchmark_main --task 1 --max-output-tokens 30000
```

默认输出 token 上限是：

```text
20000
```

该上限包含模型的 reasoning tokens。即使最终只输出 `A/B/C/D/E`，也需要为内部推理保留足够空间。

## Dry Run

不调用 API，只检查图片路径、prompt 和 answer 是否能正常读取：

```sh
python3 -m arc3d_benchmark.benchmark_main --task 1 --dry-run
```

预期输出类似：

```text
task=task1 model=gpt-5 correct=skipped accuracy=skipped
expected=['A', 'C', 'D'] predicted=[]
saved=/Users/ruyinfeng/Desktop/axa repo/ARC3D/benchmark_results/...
```

## View Policy

当前默认：

```sh
--view-policy all
```

含义：一次性把每个 puzzle 的全部 14 张 fixed-view 图片都发给模型。

另一个保留接口：

```sh
--view-policy neg-z-first
```

当前只发送 `face-nz.png`。这是为了之后扩展成交互式视角机制，比如先给一个初始视角，然后模型可以请求左转、右转、斜向上、斜向下等 action。

## Evaluation 规则

当前 task 都是选择题。

评估逻辑：

- 模型输出从 `A/B/C/D/E` 中解析
- 单选和多选共用一个 evaluator
- 多选顺序不影响判分
- 例如 expected 是 `A,C,D`，模型输出 `D A C` 也会判对

结果会保存到：

```sh
benchmark_results/
```

每次运行生成一个 JSON，包含：

- task id
- model
- max output tokens
- view policy
- raw model output
- expected answer
- predicted answer
- correct
- accuracy
- 原始 API response

## 迁移到新电脑/新账号

推荐方式：

1. 复制整个 `ARC3D` 文件夹到新电脑。
2. 在新电脑打开 Codex，并把工作目录指到 `ARC3D`。
3. 在终端运行：

```sh
cd "新电脑上的/ARC3D"
python3 -m arc3d_benchmark.benchmark_main --task 1 --dry-run
```

4. 如果 dry-run 正常，再设置 Azure OpenAI API key：

```sh
export AZURE_OPENAI_API_KEY="新的 key"
```

5. 正式运行：

```sh
python3 -m arc3d_benchmark.benchmark_main --task 1
python3 -m arc3d_benchmark.benchmark_main --task 2
python3 -m arc3d_benchmark.benchmark_main --task 3
```

## 新账号继续工作时可以直接给 Codex 的提示

可以把下面这段发给新 Codex：

```text
请先完整阅读当前 ARC3D 项目，尤其是 ARC3D_WORK_TRANSFER.md、arc3d_benchmark/、rendered_puzzle_images/、task1/task2/task3。这个项目是一个受 ARC 启发的 3D puzzle benchmark。当前 benchmark 已支持一次只测试一个 task，输入为每个 puzzle 的 14 张 fixed-view PNG，examples 带 answer，test 不在 prompt 中显示 answer，evaluation 会比较模型输出的 A/B/C/D/E，且多选顺序无关。请先运行 python3 -m arc3d_benchmark.benchmark_main --task 1 --dry-run 确认环境，然后继续协助我完善 benchmark。
```

## 目前建议的下一步

- 把 `rendered_puzzle_images` 纳入正式数据版本管理，或单独压缩保存。
- 决定 `test/answer.txt` 是否继续放在同一个图片目录里。当前 evaluator 需要它，但 prompt 不会把 test answer 发给模型。
- 后续可以实现 interactive view policy：先给 `face-nz`，模型通过 action 请求更多视角。
- 可以增加 batch runner，一次跑 task1/task2/task3 并汇总 average accuracy。
- 可以增加 prompt version 字段，方便比较不同 prompt 对 benchmark 结果的影响。

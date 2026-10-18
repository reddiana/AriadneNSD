<!-- 2번: Svelte 5. HTML에 값을 적어 두면, 값이 바뀔 때 그 자리만 고쳐진다. -->
<script>
  import { T, KINDS } from './editor-stub.js';
  let { ed } = $props();
  let s = $state.raw(ed.get());
  $effect(() => ed.subscribe((v) => (s = v)));
  let open = $state(false);
  let t = $derived(T[s.lang]);
</script>

<button onclick={() => ed.undo()} disabled={!s.past.length}>{t.undo}</button>
<button onclick={() => ed.redo()} disabled={!s.future.length}>{t.redo}</button>
<label>{t.kind}
  <select value={s.kind} onchange={(e) => ed.setKind(e.target.value)}>
    {#each KINDS as k}<option>{k}</option>{/each}
  </select>
</label>
<button onclick={() => (open = !open)}>{t.settings}</button>
{#if open}
  <div class="panel">{t.lang}
    <label><input type="radio" checked={s.lang === 'en'} onchange={() => ed.setLang('en')}>English</label>
    <label><input type="radio" checked={s.lang === 'ko'} onchange={() => ed.setLang('ko')}>한국어</label>
  </div>
{/if}

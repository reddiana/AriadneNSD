import { mount } from 'svelte';
import Toolbar from './Toolbar.svelte';
import { createEditor } from './editor-stub.js';
mount(Toolbar, { target: document.getElementById('app'), props: { ed: createEditor() } });

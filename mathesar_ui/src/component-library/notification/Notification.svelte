<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import {
    iconExclamationCircle,
    iconTimes,
  } from '@mathesar-component-library-dir/common/icons';
  import { Icon, Button } from '@mathesar-component-library';

  const dispatch = createEventDispatcher();

  export let type: 'info' | 'success' | 'danger';
  export let show = true;
  export let closable = true;

  function close() {
    show = false;
    dispatch('close');
  }
</script>

{#if show}
  <div class="notification {type}" transition:fade={{ duration: 120 }}>
    <div class="header">
      <div class="icon">
        <Icon {...iconExclamationCircle} />
      </div>
      <strong class="message">
        <slot />
      </strong>
      {#if closable}
        <Button class="close" appearance="ghost" size="medium" on:click={close}>
          <Icon {...iconTimes} />
        </Button>
      {/if}
    </div>
    {#if $$slots.description}
      <div class="description">
        <slot name="description" />
      </div>
    {/if}
  </div>
{/if}

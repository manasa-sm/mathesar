<script lang="ts">
  import { onMount, getContext, tick } from 'svelte';
  import type { ListBoxContext } from './ListBoxTypes';

  type Option = $$Generic;

  export let id: string;
  let classes = '';
  export { classes as class };

  const { api, state } = getContext<ListBoxContext<Option>>('LIST_BOX_CONTEXT');
  const { displayedOptions, value, focusedOptionIndex, staticProps } = state;

  let listBoxElement: HTMLUListElement;

  function scrollToFocusedItem(): void {
    if (listBoxElement) {
      const elementInFocus: HTMLElement | null =
        listBoxElement.querySelector('.in-focus');
      const container = listBoxElement.parentElement as HTMLElement;
      if (elementInFocus && container) {
        if (
          elementInFocus.offsetTop + elementInFocus.clientHeight >
          container.scrollTop + container.clientHeight
        ) {
          const offsetValue: number =
            container.getBoundingClientRect().bottom -
            elementInFocus.getBoundingClientRect().bottom;
          container.scrollTop -= offsetValue;
        } else if (elementInFocus.offsetTop < container.scrollTop) {
          container.scrollTop = elementInFocus.offsetTop;
        }
      }
    }
  }

  onMount(() => {
    scrollToFocusedItem();

    return focusedOptionIndex.subscribe(() => {
      void tick().then(() => scrollToFocusedItem());
    });
  });
</script>

<ul
  bind:this={listBoxElement}
  tabindex="0"
  {id}
  role="listbox"
  aria-expanded="true"
  class={['list-box-options', $staticProps.selectionType, ...classes].join(' ')}
>
  {#each $displayedOptions as option, index (option)}
    <li
      role="option"
      class:selected={$value.some((opt) =>
        $staticProps.checkEquality(opt, option),
      )}
      class:in-focus={index === $focusedOptionIndex}
      on:click={() => api.pick(option)}
    >
      <span>{$staticProps.getLabel(option, $staticProps.labelKey)}</span>
    </li>
  {/each}
</ul>

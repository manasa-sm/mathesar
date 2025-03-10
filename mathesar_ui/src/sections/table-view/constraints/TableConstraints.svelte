<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import {
    Icon,
    ControlledModal,
    DropdownMenu,
    MenuItem,
  } from '@mathesar-component-library';
  import { getContext } from 'svelte';
  import type { TabularDataStore } from '@mathesar/stores/table-data/types';
  import type {
    Constraint,
    ConstraintsDataStore,
  } from '@mathesar/stores/table-data/types';
  import { States } from '@mathesar/utils/api';
  import { iconPlus, iconSnowflake, iconSpinner } from '@mathesar/icons';

  import { modal } from '@mathesar/stores/modal';
  import NewUniqueConstraintModal from './NewUniqueConstraintModal.svelte';
  import TableConstraint from './TableConstraint.svelte';
  import ConstraintHelp from './__help__/ConstraintHelp.svelte';

  export let controller: ModalController;

  const tabularData = getContext<TabularDataStore>('tabularData');
  const newUniqueConstraintModal = modal.spawnModalController();

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: state = $constraintsDataStore.state;
  $: errorMsg = $constraintsDataStore.error;
  $: constraints = $constraintsDataStore.constraints;
  $: isEmpty = constraints.length === 0;
  $: isLoading = state === States.Idle || state === States.Loading;
  // Only show the spinner during the _initial_ loading event. Hide it for
  // subsequent updates so that we can rely on the spinner used on the button
  // for the more specific update.
  $: shouldShowLoadingSpinner = isEmpty && isLoading;
  $: countText = isEmpty ? '' : ` (${constraints.length as number})`;

  function remove(constraint: Constraint) {
    return (constraintsDataStore as ConstraintsDataStore).remove(constraint.id);
  }
</script>

<ControlledModal {controller}>
  <span slot="title">Table Constraints{countText} <ConstraintHelp /></span>
  <div class="table-constraints">
    {#if shouldShowLoadingSpinner}
      <Icon {...iconSpinner} spin={true} />
    {:else if state === States.Error}
      <div>Unable to fetch table constraints</div>
      <div>{errorMsg}</div>
    {:else if isEmpty}
      <div>No constraints</div>
    {:else}
      <div class="constraints-list">
        {#each constraints as constraint (constraint.id)}
          <TableConstraint {constraint} drop={() => remove(constraint)} />
        {/each}
      </div>
    {/if}
  </div>

  <div slot="footer" class="footer">
    <DropdownMenu label="New Constraint" icon={iconPlus}>
      <MenuItem
        on:click={() => newUniqueConstraintModal.open()}
        icon={iconSnowflake}
      >
        Unique
      </MenuItem>
    </DropdownMenu>
  </div>

  <NewUniqueConstraintModal controller={newUniqueConstraintModal} />
</ControlledModal>

<style>
  .constraints-list {
    border: solid #ccc 1px;
    border-radius: 4px;
  }
  .footer {
    text-align: right;
  }
</style>

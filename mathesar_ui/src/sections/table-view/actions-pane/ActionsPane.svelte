<script lang="ts">
  import { getContext } from 'svelte';
  import {
    faSync,
    faExclamationTriangle,
  } from '@fortawesome/free-solid-svg-icons';

  import { States } from '@mathesar/utils/api';
  import {
    Button,
    Icon,
    Dropdown,
    DropdownMenu,
    MenuItem,
  } from '@mathesar-component-library';
  import type { TabularDataStore } from '@mathesar/stores/table-data/types';
  import { refetchTablesForSchema, deleteTable } from '@mathesar/stores/tables';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  import { getTabsForSchema } from '@mathesar/stores/tabs';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import TableConstraints from '../constraints/TableConstraints.svelte';
  import DisplayFilter from '../display-options/DisplayFilter.svelte';
  import DisplaySort from '../display-options/DisplaySort.svelte';
  import DisplayGroup from '../display-options/DisplayGroup.svelte';
  import RenameTableModal from './RenameTableModal.svelte';
  import {
    iconConstraints,
    iconDelete,
    iconRename,
    iconSettings,
    iconFilter,
    iconSort,
    iconListAlt,
    iconSync,
    iconExclamationTriangle,
    iconPlus,
  } from '@mathesar/icons';

  const tabularData = getContext<TabularDataStore>('tabularData');

  const tableConstraintsModal = modal.spawnModalController();
  const tableRenameModal = modal.spawnModalController();

  $: ({ columnsDataStore, recordsData, meta, constraintsDataStore } =
    $tabularData);
  $: ({ columns } = $columnsDataStore);
  $: ({ filtering, sorting, grouping, selectedRows, sheetState } = meta);
  $: recordState = recordsData.state;

  $: isLoading =
    $columnsDataStore.state === States.Loading ||
    $recordState === States.Loading ||
    $constraintsDataStore.state === States.Loading;
  $: isError =
    $columnsDataStore.state === States.Error ||
    $recordState === States.Error ||
    $constraintsDataStore.state === States.Error;

  function refresh() {
    void $tabularData.refresh();
  }

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteTable($tabularData.id);
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        const tabList = getTabsForSchema($currentDBName, $currentSchemaId);
        const tab = tabList.getTabularTabByTabularID(
          $tabularData.type,
          $tabularData.id,
        );
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        tabList.remove(tab);
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        await refetchTablesForSchema($currentSchemaId);
      },
    });
  }
</script>

<div class="actions-pane">
  <DropdownMenu label="Table" icon={iconSettings}>
    <MenuItem on:click={() => tableRenameModal.open()} icon={iconRename}>
      Rename
    </MenuItem>
    <MenuItem on:click={handleDeleteTable} icon={iconDelete}>Delete</MenuItem>
    <MenuItem
      on:click={() => tableConstraintsModal.open()}
      icon={iconConstraints}
    >
      Constraints
    </MenuItem>
  </DropdownMenu>

  <TableConstraints controller={tableConstraintsModal} />

  <RenameTableModal controller={tableRenameModal} tabularData={$tabularData} />

  <div class="divider" />

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon {...iconFilter} size="0.8em" />
      <span>
        Filters
        {#if $filtering.entries.length > 0}
          ({$filtering.entries.length})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <DisplayFilter {columns} filtering={meta.filtering} />
    </svelte:fragment>
  </Dropdown>

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon {...iconSort} />
      <span>
        Sort
        {#if $sorting.size > 0}
          ({$sorting.size})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <DisplaySort {columns} sorting={meta.sorting} />
    </svelte:fragment>
  </Dropdown>

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon {...iconListAlt} />
      <span>
        Group
        {#if $grouping.size > 0}
          ({$grouping.size})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <DisplayGroup {columns} grouping={meta.grouping} />
    </svelte:fragment>
  </Dropdown>

  <div class="divider" />

  <Button size="small" on:click={() => recordsData.addEmptyRecord()}>
    <Icon {...iconPlus} />
    <span> New Record </span>
  </Button>

  {#if $selectedRows.size > 0}
    <Button size="small" on:click={() => recordsData.deleteSelected()}>
      <Icon {...iconDelete} />
      <span>
        Delete {$selectedRows.size} records
      </span>
    </Button>
  {/if}

  {#if $sheetState}
    <div class="divider" />
    <div class="save-status">
      {#if $sheetState === 'processing'}
        Saving changes
      {:else if $sheetState === 'failure'}
        <span class="error">! Couldn't save changes</span>
      {:else if $sheetState === 'success'}
        All changes saved
      {/if}
    </div>
  {/if}

  <div class="loading-info">
    <Button size="small" disabled={isLoading} on:click={refresh}>
      <Icon
        data={isError && !isLoading ? faExclamationTriangle : faSync}
        spin={isLoading}
      />
      <span>
        {#if isLoading}
          Loading
        {:else if isError}
          Retry
        {:else}
          Refresh
        {/if}
      </span>
    </Button>
  </div>
</div>

<style global lang="scss">
  @import 'ActionsPane.scss';
</style>

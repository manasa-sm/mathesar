<script lang="ts">
  import { iconSync, iconPlus } from '@mathesar/icons';
  import { Checkbox, Icon } from '@mathesar-component-library';
  import { ROW_CONTROL_COLUMN_WIDTH } from '@mathesar/stores/table-data';
  import { getRowKey } from '@mathesar/stores/table-data';
  import type {
    Meta,
    RecordsData,
    Row,
  } from '@mathesar/stores/table-data/types';
  import CellErrors from './CellErrors.svelte';

  export let primaryKeyColumnId: number | undefined = undefined;
  export let row: Row;
  export let meta: Meta;
  export let recordsData: RecordsData;

  $: ({ selectedRows, pagination, rowStatus } = meta);
  $: ({ savedRecords, newRecords, totalCount } = recordsData);
  $: primaryKeyValue = primaryKeyColumnId
    ? row.record?.[primaryKeyColumnId]
    : undefined;
  $: rowKey = getRowKey(row, primaryKeyColumnId);
  $: status = $rowStatus.get(rowKey);
  $: state = status?.wholeRowState;
  $: errors = status?.errorsFromWholeRowAndCells ?? [];
  $: isRowSelected = primaryKeyValue !== undefined && $selectedRows.has(rowKey);

  function selectionChanged(event: CustomEvent<{ checked: boolean }>) {
    if (primaryKeyValue === undefined) {
      return;
    }
    const { checked } = event.detail;
    if (checked) {
      meta.selectedRows.add(rowKey);
    } else {
      meta.selectedRows.delete(rowKey);
    }
  }
</script>

<div
  class="cell row-control"
  style="width:{ROW_CONTROL_COLUMN_WIDTH}px;left:0px"
>
  <div class="control">
    {#if row.isAddPlaceholder}
      <Icon {...iconPlus} />
    {:else}
      {#if typeof row.rowIndex === 'number'}
        <span class="number">
          {row.rowIndex +
            (row.isNew
              ? ($totalCount ?? 0) - $savedRecords.length - $newRecords.length
              : $pagination.offset) +
            1}
          {#if row.isNew}
            *
          {/if}
        </span>
      {/if}

      {#if primaryKeyValue}
        <Checkbox checked={isRowSelected} on:change={selectionChanged} />
      {/if}
    {/if}
  </div>

  {#if state === 'processing'}
    <Icon class="mod-indicator" size="0.9em" {...iconSync} spin={true} />
  {/if}

  {#if errors.length}
    <CellErrors {errors} />
  {/if}
</div>

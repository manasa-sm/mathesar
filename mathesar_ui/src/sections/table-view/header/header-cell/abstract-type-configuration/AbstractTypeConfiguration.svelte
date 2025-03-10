<script lang="ts">
  import { createEventDispatcher, getContext, onMount } from 'svelte';
  import {
    Button,
    Spinner,
    createValidationContext,
  } from '@mathesar-component-library';
  import { States } from '@mathesar/utils/api';
  import { toast } from '@mathesar/stores/toast';

  import type { DbType } from '@mathesar/AppTypes';
  import type {
    Column,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';

  import AbstractTypeOptions from './AbstractTypeOptions.svelte';
  import AbstractTypeSelector from './AbstractTypeSelector.svelte';

  const dispatch = createEventDispatcher();

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ columnsDataStore } = $tabularData);

  export let column: Column;
  export let abstractTypeOfColumn: AbstractType | undefined;

  let selectedAbstractType: AbstractType | undefined;
  let selectedDbType: DbType | undefined;
  let typeOptions: Column['type_options'];
  let displayOptions: Column['display_options'];
  let typeChangeState = States.Idle;

  const validationContext = createValidationContext();
  $: ({ validationResult } = validationContext);

  onMount(() => {
    validationContext.validate();
  });

  function resetAbstractType() {
    selectedDbType = column.type;
    typeOptions = { ...(column.type_options ?? {}) };
    displayOptions = { ...(column.display_options ?? {}) };
    selectedAbstractType = abstractTypeOfColumn;
  }
  resetAbstractType();

  function selectAbstractType(abstractType: AbstractType) {
    if (selectedAbstractType !== abstractType) {
      if (abstractType.identifier === abstractTypeOfColumn?.identifier) {
        resetAbstractType();
      } else if (abstractType.defaultDbType) {
        selectedDbType = abstractType.defaultDbType;
        typeOptions = {};
        displayOptions = {};
      } else if (abstractType.dbTypes.size > 0) {
        [selectedDbType] = abstractType.dbTypes;
        typeOptions = {};
        displayOptions = {};
      }
      selectedAbstractType = abstractType;
    }
  }

  function close() {
    resetAbstractType();
    typeChangeState = States.Done;
    dispatch('close');
  }

  async function onSave() {
    typeChangeState = States.Loading;
    try {
      if (selectedDbType) {
        await columnsDataStore.patchType(
          column.id,
          selectedDbType,
          typeOptions,
          displayOptions,
        );
      }
    } catch (err) {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      toast.error(`Unable to change column type. ${err.message as string}`);
    }
    close();
  }

  $: isSaveDisabled =
    !selectedAbstractType ||
    typeChangeState === States.Loading ||
    !$validationResult;
</script>

<div class="column-type-menu">
  <h5 class="menu-header">Set Column Type</h5>
  <AbstractTypeSelector
    {selectedAbstractType}
    {column}
    on:selection={(e) => selectAbstractType(e.detail)}
  />

  {#if selectedAbstractType && selectedDbType}
    {#key selectedAbstractType}
      <AbstractTypeOptions
        {selectedAbstractType}
        bind:selectedDbType
        bind:typeOptions
        bind:displayOptions
        {column}
      />
    {/key}
  {/if}

  <div class="divider" />
  <div class="type-menu-footer">
    <Button appearance="primary" disabled={isSaveDisabled} on:click={onSave}>
      {#if typeChangeState === States.Loading}
        <Spinner />
      {/if}
      <span>Save</span>
    </Button>
    <Button appearance="default" on:click={close}>Close</Button>
  </div>
</div>

<style global lang="scss">
  @import 'AbstractTypeConfiguration.scss';
</style>

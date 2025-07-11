'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle, Store, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useStoreModal } from '@/hooks/use-store-modal';
import { useStoreLimits } from '@/hooks/use-store-limits';
import { useParams, useRouter } from 'next/navigation';

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface StoreSwitcherProps extends PopoverTriggerProps {
  items: Record<string, any>[];
}

export default function StoreSwitcher({
  className,
  items = [],
}: StoreSwitcherProps) {
  const storeModal = useStoreModal();
  const params = useParams();
  const router = useRouter();
  const storeLimits = useStoreLimits(items.length);

  const formattedItems = items.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const currentStore = formattedItems.find(
    (item) => item.value === params.storeId
  );

  const [open, setOpen] = React.useState(false);

  const onStoreSelect = (store: { value: string; label: string }) => {
    setOpen(false);
    router.push(`/${store.value}`);
  };

  const handleCreateStore = () => {
    setOpen(false);
    if (storeLimits.canCreateStore) {
      storeModal.onOpen();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='default'
          role='combobox'
          aria-expanded={open}
          aria-label='Select a store'
          className={cn(
            'w-[200px] justify-between bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 hover:text-white rounded-md h-9',
            className
          )}
        >
          <Store className='mr-2 h-4 w-4 text-gray-300' />
          <span className="font-medium truncate flex-1 text-left text-white">
            {currentStore?.label}
          </span>
          <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 text-gray-400' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0 bg-white border border-gray-200 shadow-lg'>
        <Command className="bg-white">
          <CommandList>
            <CommandInput placeholder='Search store...' className="font-medium" />
            <CommandEmpty className="text-center py-3 text-sm text-gray-600">No store found.</CommandEmpty>
            <CommandGroup heading='Stores' className="font-medium text-gray-600">
              {formattedItems.map((store) => (
                <CommandItem
                  key={store.value}
                  onSelect={() => onStoreSelect(store)}
                  className='text-sm font-medium hover:bg-gray-100 text-gray-900'
                >
                  <Store className='mr-2 h-4 w-4 text-gray-600' />
                  {store.label}
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4 text-blue-600',
                      currentStore?.value === store.value
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateStore}
                disabled={!storeLimits.canCreateStore}
                className={cn(
                  "font-medium",
                  storeLimits.canCreateStore
                    ? "hover:bg-gray-100 text-gray-900 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed opacity-50"
                )}
              >
                {storeLimits.canCreateStore ? (
                  <PlusCircle className='mr-2 h-5 w-5 text-gray-600' />
                ) : (
                  <Lock className='mr-2 h-5 w-5 text-gray-400' />
                )}
                <div className="flex flex-col">
                  <span>Create Store</span>
                  {!storeLimits.canCreateStore && !storeLimits.isLoading && (
                    <span className="text-xs text-gray-400 mt-0.5">
                      {storeLimits.isExpired
                        ? 'Subscription expired'
                        : !storeLimits.isSubscribed
                          ? 'Subscription required'
                          : `Limit reached (${storeLimits.storesAllowed})`
                      }
                    </span>
                  )}
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
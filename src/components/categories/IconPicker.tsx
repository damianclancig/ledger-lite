"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Check } from 'lucide-react';
import { CATEGORY_ICON_GROUPS } from '@/lib/category-icons';
import { getLucideIcon } from '@/lib/icon-utils';
import { useTranslations } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  selectedIcon?: string;
  onSelectIcon: (iconName: string) => void;
  label?: string;
}

export function IconPicker({ selectedIcon, onSelectIcon, label }: IconPickerProps) {
  const { translations } = useTranslations();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const effectiveLabel = label || translations.iconPicker.selectIcon;

  const SelectedIconComponent = selectedIcon ? getLucideIcon(selectedIcon) : null;

  // Filter icons based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return CATEGORY_ICON_GROUPS;

    const filtered: typeof CATEGORY_ICON_GROUPS = {} as any;
    const lowerSearch = searchTerm.toLowerCase();

    Object.entries(CATEGORY_ICON_GROUPS).forEach(([key, group]) => {
      const matchingIcons = group.icons.filter(icon =>
        icon.toLowerCase().includes(lowerSearch)
      );

      if (matchingIcons.length > 0) {
        filtered[key as keyof typeof CATEGORY_ICON_GROUPS] = {
          ...group,
          icons: matchingIcons
        };
      }
    });

    return filtered;
  }, [searchTerm]);

  const allUniqueIcons = useMemo(() => {
    const icons = Object.values(filteredGroups).flatMap(group => group.icons);
    return Array.from(new Set(icons));
  }, [filteredGroups]);

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10"
        >
          <div className="flex items-center gap-2">
            {SelectedIconComponent && <SelectedIconComponent size={16} />}
            <span className={cn(!selectedIcon && "text-muted-foreground")}>
              {selectedIcon || effectiveLabel}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={translations.iconPicker.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-3 h-auto flex-wrap">
            <TabsTrigger value="all" className="text-xs">{translations.iconPicker.groups.all}</TabsTrigger>
            {Object.entries(filteredGroups).map(([key, group]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {translations.iconPicker.groups[key as keyof typeof translations.iconPicker.groups] || group.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[300px]">
            <TabsContent value="all" className="m-0 p-3">
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {allUniqueIcons.map(iconName => {
                    const IconComponent = getLucideIcon(iconName);
                    if (!IconComponent) return null;

                    return (
                      <button
                        key={iconName}
                        onClick={() => handleSelectIcon(iconName)}
                        className={cn(
                          "relative flex items-center justify-center h-10 w-10 rounded-md border hover:bg-accent hover:border-primary transition-colors",
                          selectedIcon === iconName && "bg-primary/10 border-primary"
                        )}
                        title={iconName}
                      >
                        <IconComponent size={18} />
                        {selectedIcon === iconName && (
                          <Check className="absolute -top-1 -right-1 h-4 w-4 text-primary bg-background rounded-full" />
                        )}
                      </button>
                    );
                  })
                }
              </div>
            </TabsContent>

            {Object.entries(filteredGroups).map(([key, group]) => (
              <TabsContent key={key} value={key} className="m-0 p-3">
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {group.icons.map(iconName => {
                    const IconComponent = getLucideIcon(iconName);
                    if (!IconComponent) return null;

                    return (
                      <button
                        key={iconName}
                        onClick={() => handleSelectIcon(iconName)}
                        className={cn(
                          "relative flex items-center justify-center h-10 w-10 rounded-md border hover:bg-accent hover:border-primary transition-colors",
                          selectedIcon === iconName && "bg-primary/10 border-primary"
                        )}
                        title={iconName}
                      >
                        <IconComponent size={18} />
                        {selectedIcon === iconName && (
                          <Check className="absolute -top-1 -right-1 h-4 w-4 text-primary bg-background rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

import React from 'react'
import { MagnifyingGlass, Funnel, SortAscending } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UnifiedCategory } from '@/hooks/usePhotoStorage'
import { sanitizeSearchQuery } from '@/lib/sanitizer'

interface SearchAndFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategoryFilter: string
  onCategoryFilterChange: (categoryId: string) => void
  categories: UnifiedCategory[]
  sortBy: 'name' | 'date' | 'size'
  onSortByChange: (sortBy: 'name' | 'date' | 'size') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  selectedCategoryFilter,
  onCategoryFilterChange,
  categories,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}: SearchAndFilterProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search photos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(sanitizeSearchQuery(e.target.value))}
                className="pl-10"
                maxLength={100}
              />
            </div>
          </div>
          
          <Select value={selectedCategoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-48">
              <Funnel className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id || category.name} value={category.id || `category-${category.name}`}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-32">
              <SortAscending className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
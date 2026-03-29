export interface AgeRange {
  type: 'U3' | 'Ü3'
  minAge: number
  maxAge: number
}

export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

export function calculateAgeRange(dateOfBirth: string): AgeRange {
  const age = calculateAge(dateOfBirth)
  
  if (age < 3) {
    return { type: 'U3', minAge: 0, maxAge: 2 }
  } else {
    return { type: 'Ü3', minAge: 3, maxAge: 6 }
  }
}

export function suggestGroupsForChild(
  child: { date_of_birth: string },
  availableGroups: Array<{ id: string; name: string; age_range: string; capacity: number }>,
  currentChildrenCount: Record<string, number>
): Array<{ group: any; match: 'perfect' | 'good' | 'acceptable'; reason: string }> {
  const ageRange = calculateAgeRange(child.date_of_birth)
  const suggestions: Array<{ group: any; match: 'perfect' | 'good' | 'acceptable'; reason: string }> = []

  for (const group of availableGroups) {
    const groupAgeRange = group.age_range.toUpperCase()
    const isAgeMatch = groupAgeRange === ageRange.type || 
                       (groupAgeRange.includes('U3') && ageRange.type === 'U3') ||
                       (groupAgeRange.includes('Ü3') && ageRange.type === 'Ü3') ||
                       (groupAgeRange.includes('U3') && ageRange.type === 'Ü3')

    if (!isAgeMatch) continue

    const currentCount = currentChildrenCount[group.id] || 0
    const available = group.capacity - currentCount

    if (available <= 0) {
      suggestions.push({
        group,
        match: 'acceptable',
        reason: 'Group is at capacity'
      })
      continue
    }

    let match: 'perfect' | 'good' | 'acceptable' = 'good'
    let reason = ''

    if (groupAgeRange === ageRange.type) {
      match = 'perfect'
      reason = `Perfect age match (${ageRange.type})`
    } else if (groupAgeRange.includes(ageRange.type)) {
      match = 'good'
      reason = `Good age match (${ageRange.type})`
    } else {
      match = 'acceptable'
      reason = 'Acceptable but not ideal age range'
    }

    if (available < 3) {
      match = match === 'perfect' ? 'good' : 'acceptable'
      reason += ` - Limited capacity (${available} spots)`
    }

    suggestions.push({ group, match, reason })
  }

  return suggestions.sort((a, b) => {
    const order = { perfect: 1, good: 2, acceptable: 3 }
    return order[a.match] - order[b.match]
  })
}

export function checkGroupCapacity(
  groupId: string,
  currentCount: number,
  groupCapacity: number
): { available: boolean; availableSpots: number; warning: string | null } {
  const availableSpots = Math.max(0, groupCapacity - currentCount)
  const utilization = groupCapacity > 0 ? (currentCount / groupCapacity) * 100 : 0

  let warning: string | null = null
  if (utilization >= 100) {
    warning = 'Group is at full capacity'
  } else if (utilization >= 90) {
    warning = 'Group is nearly full'
  } else if (utilization >= 80) {
    warning = 'Group is getting full'
  }

  return {
    available: availableSpots > 0,
    availableSpots,
    warning
  }
}

export function validateGroupAssignment(
  child: { date_of_birth: string; id?: string },
  group: { id: string; age_range: string; capacity: number },
  currentChildrenCount: number
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  const ageRange = calculateAgeRange(child.date_of_birth)
  const groupAgeRange = group.age_range.toUpperCase()
  const isAgeMatch = groupAgeRange === ageRange.type || 
                     groupAgeRange.includes('U3') || 
                     groupAgeRange.includes('Ü3')

  if (!isAgeMatch) {
    warnings.push(`Child is ${ageRange.type} but group is ${group.age_range}`)
  }

  const capacityCheck = checkGroupCapacity(group.id, currentChildrenCount, group.capacity)
  if (!capacityCheck.available) {
    errors.push('Group is at full capacity')
  } else if (capacityCheck.warning) {
    warnings.push(capacityCheck.warning)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

export const formatMemoDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getCategoryColor = (category: string) => {
  const colors = {
    personal: 'bg-blue-100 text-blue-800',
    work: 'bg-green-100 text-green-800',
    study: 'bg-purple-100 text-purple-800',
    idea: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800',
  }
  return colors[category as keyof typeof colors] || colors.other
}

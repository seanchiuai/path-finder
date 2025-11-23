"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SalaryDataPoint {
  percentile: number
  salary: number
  experience: number
}

interface SalaryBellCurveProps {
  data: SalaryDataPoint[]
}

export function SalaryBellCurve({ data }: SalaryBellCurveProps) {
  const [selectedPoint, setSelectedPoint] = useState<SalaryDataPoint | null>(null)
  
  // Sort data by percentile for proper display
  const sortedData = [...data].sort((a, b) => a.percentile - b.percentile)
  
  // Find min and max salary for scaling
  const minSalary = Math.min(...data.map(d => d.salary))
  const maxSalary = Math.max(...data.map(d => d.salary))
  
  // Convert salary to percentage height for visualization
  const getBarHeight = (salary: number) => {
    const range = maxSalary - minSalary
    const normalized = (salary - minSalary) / range
    return Math.max(20, normalized * 200) // Minimum 20px, max 200px
  }
  
  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary)
  }

  return (
    <div className="space-y-6">
      {/* Interactive Bell Curve Visualization */}
      <div className="relative">
        <div className="flex items-end justify-between h-64 bg-gradient-to-t from-muted/20 to-transparent rounded-lg p-4">
          {sortedData.map((point, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className="relative">
                <div
                  className={`w-12 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md cursor-pointer transition-all hover:from-blue-600 hover:to-blue-500 ${
                    selectedPoint?.percentile === point.percentile ? 'ring-2 ring-blue-600' : ''
                  }`}
                  style={{ height: `${getBarHeight(point.salary)}px` }}
                  onClick={() => setSelectedPoint(point)}
                />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium">
                  {formatSalary(point.salary)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {point.percentile}th percentile
              </div>
            </div>
          ))}
        </div>
        
        {/* Experience axis */}
        <div className="flex justify-between mt-2 px-4 text-xs text-muted-foreground">
          <span>Entry Level</span>
          <span>Mid Level</span>
          <span>Senior Level</span>
        </div>
      </div>

      {/* Detailed Information Panel */}
      {selectedPoint && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Salary Range</h4>
                <p className="text-2xl font-bold text-blue-800">
                  {formatSalary(selectedPoint.salary)}
                </p>
                <p className="text-sm text-blue-600">
                  {selectedPoint.percentile}th percentile
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Experience Level</h4>
                <p className="text-lg font-medium text-blue-800">
                  {selectedPoint.experience}+ years
                </p>
                <p className="text-sm text-blue-600">
                  Typical experience range
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Career Stage</h4>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {selectedPoint.percentile <= 25 ? 'Entry Level' : 
                   selectedPoint.percentile <= 75 ? 'Mid Level' : 'Senior Level'}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Click on different points in the chart to explore salary ranges 
                and experience requirements for this career path.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!selectedPoint && (
        <Card className="border-muted-foreground/20">
          <CardContent className="pt-6">
            <CardDescription>
              Click on any point in the salary chart above to see detailed information 
              about salary ranges, experience requirements, and career progression.
            </CardDescription>
          </CardContent>
        </Card>
      )}
      
      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {formatSalary(sortedData[0].salary)}
            </div>
            <div className="text-sm text-muted-foreground">Entry Level</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {formatSalary(sortedData[2].salary)}
            </div>
            <div className="text-sm text-muted-foreground">Median Salary</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {formatSalary(sortedData[4].salary)}
            </div>
            <div className="text-sm text-muted-foreground">Top 10%</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              +{Math.round(((sortedData[4].salary - sortedData[0].salary) / sortedData[0].salary) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Growth Potential</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}